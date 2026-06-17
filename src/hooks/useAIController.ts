import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_THINKING_DELAY_MS } from '../constants/game';
import { makeAIMove, type AIInput } from '../ai';
import type { AIDifficulty, PieceAttributes } from '../types/game';
import { arePiecesEqual, formatPieceForLogging, getOpponent } from '../utils/gameUtils';
import { debugLog } from '../utils/logger';
import type { AIResetRef, EnableAILoggingRef, QuartoGame } from './quartoGameTypes';

export interface AIController {
  player1AI: boolean;
  setPlayer1AI: (value: boolean) => void;
  player2AI: boolean;
  setPlayer2AI: (value: boolean) => void;
  basicAIDifficulty: AIDifficulty;
  setBasicAIDifficulty: (value: AIDifficulty) => void;
  enableAILogging: boolean;
  setEnableAILogging: (value: boolean) => void;
}

interface AIMovePayload {
  placement?: { row: number; col: number } | null;
  pieceToGive?: PieceAttributes | null;
}

export function useAIController(
  game: QuartoGame,
  aiResetRef: AIResetRef,
  enableAILoggingRef: EnableAILoggingRef
): AIController {
  const {
    board,
    stagedPiece,
    availablePieces,
    currentPlayer,
    gamePhase,
    gameState,
    setBoard,
    setStagedPiece,
    setAvailablePieces,
    setCurrentPlayer,
    setGamePhase,
    setLastMove,
  } = game;

  const [player1AI, setPlayer1AI] = useState(true);
  const [player2AI, setPlayer2AI] = useState(false);
  const [basicAIDifficulty, setBasicAIDifficulty] = useState<AIDifficulty>('easy');
  const [enableAILogging, setEnableAILogging] = useState(false);

  const executionCountRef = useRef(0);
  const pendingExecutionRef = useRef(false);
  const aiMoveInProgressRef = useRef(false);
  const scheduleGenerationRef = useRef(0);
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const part2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const basicAIDifficultyRef = useRef(basicAIDifficulty);
  const executeAIMoveRef = useRef<() => void>(() => {});

  enableAILoggingRef.current = enableAILogging;
  basicAIDifficultyRef.current = basicAIDifficulty;

  const clearEffectTimer = useCallback(() => {
    if (effectTimerRef.current !== null) {
      clearTimeout(effectTimerRef.current);
      effectTimerRef.current = null;
    }
  }, []);

  const clearPart2Timer = useCallback(() => {
    if (part2TimerRef.current !== null) {
      clearTimeout(part2TimerRef.current);
      part2TimerRef.current = null;
    }
  }, []);

  const completeAIMove = useCallback(() => {
    aiMoveInProgressRef.current = false;
    pendingExecutionRef.current = false;
  }, []);

  const resetAIExecutionRefs = useCallback(() => {
    scheduleGenerationRef.current += 1;
    clearEffectTimer();
    clearPart2Timer();
    executionCountRef.current = 0;
    aiMoveInProgressRef.current = false;
    pendingExecutionRef.current = false;
  }, [clearEffectTimer, clearPart2Timer]);

  aiResetRef.current = resetAIExecutionRefs;

  const applyAIMovePart2 = useCallback(
    (pieceToGive: PieceAttributes) => {
      debugLog(enableAILoggingRef.current, `🎁 STEP 2 - AI Player ${currentPlayer} giving piece to Player ${getOpponent(currentPlayer)}`);
      debugLog(enableAILoggingRef.current, `🔍 PIECE DETAILS - Given piece: ${formatPieceForLogging(pieceToGive)} (height:${pieceToGive.height}, color:${pieceToGive.color}, shape:${pieceToGive.shape}, top:${pieceToGive.top})`);
      debugLog(enableAILoggingRef.current, `🔍 This piece will be staged for Player ${getOpponent(currentPlayer)} to place`);

      setStagedPiece(pieceToGive);
      debugLog(enableAILoggingRef.current, `✅ NEW STAGED PIECE SET: ${formatPieceForLogging(pieceToGive)}`);

      setAvailablePieces(prev => prev.filter(p => !arePiecesEqual(p, pieceToGive)));
      setCurrentPlayer(prev => getOpponent(prev));
      setGamePhase('place');

      debugLog(enableAILoggingRef.current, `✅ STEP 2 COMPLETE - Piece given, switched to Player ${getOpponent(currentPlayer)} in place phase`);
      debugLog(enableAILoggingRef.current, `🎯 ======= AI COMPLETE MOVE FINISHED =======\n`);

      completeAIMove();
    },
    [currentPlayer, setStagedPiece, setAvailablePieces, setCurrentPlayer, setGamePhase, completeAIMove]
  );

  const schedulePart2 = useCallback(
    (pieceToGive: PieceAttributes) => {
      clearPart2Timer();
      const generation = scheduleGenerationRef.current;

      part2TimerRef.current = setTimeout(() => {
        part2TimerRef.current = null;
        if (generation !== scheduleGenerationRef.current) {
          completeAIMove();
          return;
        }
        applyAIMovePart2(pieceToGive);
      }, AI_THINKING_DELAY_MS);
    },
    [applyAIMovePart2, clearPart2Timer, completeAIMove]
  );

  const applyAIMove = useCallback(
    (aiMove: AIMovePayload) => {
      debugLog(enableAILoggingRef.current, `🔧 Applying AI complete move:`, {
        placement: aiMove.placement,
        pieceToGive: aiMove.pieceToGive,
        currentGamePhase: gamePhase,
        hasStagedPiece: !!stagedPiece,
      });

      if (aiMove.placement && stagedPiece) {
        debugLog(enableAILoggingRef.current, `📍 STEP 1 - Placing piece at (${aiMove.placement.row}, ${aiMove.placement.col})`);
        debugLog(enableAILoggingRef.current, `🔍 PIECE DETAILS - Staged piece being placed: ${formatPieceForLogging(stagedPiece)} (height:${stagedPiece.height}, color:${stagedPiece.color}, shape:${stagedPiece.shape}, top:${stagedPiece.top})`);
        debugLog(enableAILoggingRef.current, `🔍 Current player placing: Player ${currentPlayer}`);

        const piecePlaced = stagedPiece;
        setBoard(prev => {
          const newBoard = prev.map(row => [...row]);
          newBoard[aiMove.placement!.row][aiMove.placement!.col] = piecePlaced;
          return newBoard;
        });
        setLastMove([aiMove.placement.row, aiMove.placement.col]);
        setStagedPiece(null);

        debugLog(enableAILoggingRef.current, `✅ STEP 1 COMPLETE - Piece placed, staged piece cleared`);

        if (aiMove.pieceToGive) {
          schedulePart2(aiMove.pieceToGive);
          return;
        }

        completeAIMove();
        debugLog(enableAILoggingRef.current, `🎯 ======= AI COMPLETE MOVE FINISHED =======\n`);
        return;
      }

      if (aiMove.placement && !stagedPiece) {
        debugLog(enableAILoggingRef.current, `❌ STEP 1 FAILED - Cannot place piece, no staged piece available`);
      } else if (!aiMove.placement && stagedPiece) {
        debugLog(enableAILoggingRef.current, `🔄 STEP 1 SKIPPED - No placement specified (first move of game)`);
      }

      if (aiMove.pieceToGive) {
        applyAIMovePart2(aiMove.pieceToGive);
        return;
      }

      completeAIMove();
      debugLog(enableAILoggingRef.current, `🎯 ======= AI COMPLETE MOVE FINISHED =======\n`);
    },
    [
      stagedPiece,
      gamePhase,
      currentPlayer,
      setBoard,
      setLastMove,
      setStagedPiece,
      applyAIMovePart2,
      schedulePart2,
      completeAIMove,
    ]
  );

  const executeBasicAIMove = useCallback(() => {
    executionCountRef.current += 1;
    debugLog(enableAILoggingRef.current, `🤖 Basic AI (Player ${currentPlayer}) is thinking... [Execution #${executionCountRef.current}]`);

    const aiInput: AIInput = {
      currentPlayer,
      gamePhase,
      board,
      pieceToPlace: stagedPiece,
      availablePieces,
      enableLogging: enableAILoggingRef.current,
      difficulty: basicAIDifficultyRef.current,
    };

    const aiMove = makeAIMove(aiInput);
    debugLog(enableAILoggingRef.current, `🎯 Basic AI move completed [Execution #${executionCountRef.current}]`);

    debugLog(enableAILoggingRef.current, `🔍 AI RETURNED - Placement: ${aiMove.placement ? `(${aiMove.placement.row}, ${aiMove.placement.col})` : 'null'} - Piece to place: ${stagedPiece ? formatPieceForLogging(stagedPiece) : 'null'} ${stagedPiece ? `(height:${stagedPiece.height}, color:${stagedPiece.color}, shape:${stagedPiece.shape}, top:${stagedPiece.top})` : ''}`);
    debugLog(enableAILoggingRef.current, `🔍 AI RETURNED - PieceToGive: ${aiMove.pieceToGive ? formatPieceForLogging(aiMove.pieceToGive) : 'null'} ${aiMove.pieceToGive ? `(height:${aiMove.pieceToGive.height}, color:${aiMove.pieceToGive.color}, shape:${aiMove.pieceToGive.shape}, top:${aiMove.pieceToGive.top})` : ''}`);

    return {
      placement: aiMove.placement,
      pieceToGive: aiMove.pieceToGive,
    };
  }, [board, stagedPiece, availablePieces, currentPlayer, gamePhase]);

  const executeAIMove = useCallback(() => {
    if (gameState !== 'playing') {
      completeAIMove();
      return;
    }

    const isCurrentPlayerAI = (currentPlayer === 1 && player1AI) || (currentPlayer === 2 && player2AI);
    if (!isCurrentPlayerAI) {
      completeAIMove();
      return;
    }

    debugLog(enableAILoggingRef.current, `🎯 ======= AI MOVE START =======`);
    debugLog(enableAILoggingRef.current, `🎯 AI (Player ${currentPlayer}) executing move in phase: ${gamePhase}`);
    debugLog(enableAILoggingRef.current, `🎯 Staged piece available: ${stagedPiece ? formatPieceForLogging(stagedPiece) : 'null'} ${stagedPiece ? `(height:${stagedPiece.height}, color:${stagedPiece.color}, shape:${stagedPiece.shape}, top:${stagedPiece.top})` : ''}`);
    debugLog(enableAILoggingRef.current, `🎯 Available pieces count: ${availablePieces.length}`);

    const aiMove = executeBasicAIMove();

    if (aiMove) {
      applyAIMove(aiMove);
    } else {
      completeAIMove();
    }
  }, [
    gameState,
    currentPlayer,
    player1AI,
    player2AI,
    gamePhase,
    stagedPiece,
    availablePieces,
    executeBasicAIMove,
    applyAIMove,
    completeAIMove,
  ]);

  executeAIMoveRef.current = executeAIMove;

  useEffect(() => {
    const isCurrentPlayerAI = (currentPlayer === 1 && player1AI) || (currentPlayer === 2 && player2AI);

    if (gameState !== 'playing' || !isCurrentPlayerAI) {
      return;
    }

    if (pendingExecutionRef.current || aiMoveInProgressRef.current) {
      debugLog(enableAILoggingRef.current, '🚫 AI execution already pending or in progress, skipping...');
      return;
    }

    pendingExecutionRef.current = true;
    const generation = scheduleGenerationRef.current;

    effectTimerRef.current = setTimeout(() => {
      effectTimerRef.current = null;
      if (generation !== scheduleGenerationRef.current) {
        pendingExecutionRef.current = false;
        return;
      }

      aiMoveInProgressRef.current = true;
      executeAIMoveRef.current();
    }, AI_THINKING_DELAY_MS);

    return () => {
      clearEffectTimer();
      scheduleGenerationRef.current += 1;
      if (!aiMoveInProgressRef.current) {
        pendingExecutionRef.current = false;
      }
    };
  }, [currentPlayer, gamePhase, gameState, player1AI, player2AI, clearEffectTimer]);

  return {
    player1AI,
    setPlayer1AI,
    player2AI,
    setPlayer2AI,
    basicAIDifficulty,
    setBasicAIDifficulty,
    enableAILogging,
    setEnableAILogging,
  };
}
