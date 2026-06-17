import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_THINKING_DELAY_MS } from '../constants/game';
import { makeAIMove, type AIInput } from '../ai';
import { atomicMovesToAIMove, sanitizeMctsAIMoveForPhase } from '../mcts/parse-move';
import { formatMctsCoordinatorResult } from '../mcts/log-mcts-result';
import { getQuartoMctsCoordinator, stopQuartoMctsSearch } from '../mcts/coordinator-service';
import { MCTS_TIME_LIMIT_MS, QuartoSearchParameters } from '../mcts/search-parameters';
import { serializeQuartoGameState } from '../mcts/serialize-state';
import type { AIDifficulty, PieceAttributes } from '../types/game';
import { arePiecesEqual, formatPieceForLogging, getOpponent } from '../utils/gameUtils';
import { debugLog } from '../utils/logger';
import type { AIResetRef, AIThinkingRef, EnableAILoggingRef, HumanInputGuardRef, QuartoGame } from './quartoGameTypes';

export interface AIController {
  player1AI: boolean;
  setPlayer1AI: (value: boolean) => void;
  player2AI: boolean;
  setPlayer2AI: (value: boolean) => void;
  basicAIDifficulty: AIDifficulty;
  setBasicAIDifficulty: (value: AIDifficulty) => void;
  enableAILogging: boolean;
  setEnableAILogging: (value: boolean) => void;
  isAIThinking: boolean;
  isAIThinkingRef: AIThinkingRef;
  /** True while AI move is scheduled, running, or awaiting part 2. */
  aiTurnLockRef: HumanInputGuardRef;
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
  const [isAIThinking, setAIThinkingState] = useState(false);
  const isAIThinkingRef = useRef(false);
  const aiTurnLockRef = useRef<() => boolean>(() => false);

  const setAIThinking = useCallback((thinking: boolean) => {
    isAIThinkingRef.current = thinking;
    setAIThinkingState(thinking);
  }, []);

  const executionCountRef = useRef(0);
  const pendingExecutionRef = useRef(false);
  const aiMoveInProgressRef = useRef(false);
  const scheduleGenerationRef = useRef(0);
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const part2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const basicAIDifficultyRef = useRef(basicAIDifficulty);
  const executeAIMoveRef = useRef<() => Promise<void>>(async () => {});
  const mctsSearchSeedRef = useRef(1);
  const gamePhaseRef = useRef(gamePhase);
  const stagedPieceRef = useRef(stagedPiece);
  const currentPlayerRef = useRef(currentPlayer);

  enableAILoggingRef.current = enableAILogging;
  basicAIDifficultyRef.current = basicAIDifficulty;
  gamePhaseRef.current = gamePhase;
  stagedPieceRef.current = stagedPiece;
  currentPlayerRef.current = currentPlayer;

  aiTurnLockRef.current = () =>
    pendingExecutionRef.current ||
    aiMoveInProgressRef.current ||
    part2TimerRef.current !== null;

  const isAIPlayer = useCallback(
    (player: typeof currentPlayer) =>
      (player === 1 && player1AI) || (player === 2 && player2AI),
    [player1AI, player2AI],
  );

  /** AI may only act in give phase, or place phase when it has a piece to place. */
  const shouldAIActNow = useCallback(() => {
    const player = currentPlayerRef.current;
    const phase = gamePhaseRef.current;
    const staged = stagedPieceRef.current;
    if (!isAIPlayer(player)) return false;
    if (phase === 'give') return true;
    if (phase === 'place' && staged !== null) return true;
    return false;
  }, [isAIPlayer]);

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
    setAIThinking(false);
  }, [setAIThinking]);

  const resetAIExecutionRefs = useCallback(() => {
    stopQuartoMctsSearch();
    scheduleGenerationRef.current += 1;
    clearEffectTimer();
    clearPart2Timer();
    executionCountRef.current = 0;
    aiMoveInProgressRef.current = false;
    pendingExecutionRef.current = false;
    setAIThinking(false);
  }, [clearEffectTimer, clearPart2Timer, setAIThinking]);

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
        if (aiMove.pieceToGive) {
          setGamePhase('give');
        }

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
      setGamePhase,
      applyAIMovePart2,
      schedulePart2,
      completeAIMove,
    ]
  );

  const executeBasicAIMove = useCallback(() => {
    executionCountRef.current += 1;
    const difficulty = basicAIDifficultyRef.current;
    if (difficulty === 'mcts') {
      throw new Error('executeBasicAIMove must not be used for MCTS difficulty');
    }

    debugLog(enableAILoggingRef.current, `🤖 Basic AI (Player ${currentPlayer}, ${difficulty}) is thinking... [Execution #${executionCountRef.current}]`);

    const aiInput: AIInput = {
      currentPlayer,
      gamePhase,
      board,
      pieceToPlace: stagedPiece,
      availablePieces,
      enableLogging: enableAILoggingRef.current,
      difficulty,
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

  const executeMctsAIMove = useCallback(async () => {
    executionCountRef.current += 1;
    debugLog(enableAILoggingRef.current, `🤖 MCTS AI (Player ${currentPlayer}) is thinking... [Execution #${executionCountRef.current}]`);

    try {
      const coordinator = await getQuartoMctsCoordinator();
      const result = await coordinator.computeMove({
        state: serializeQuartoGameState(
          board,
          stagedPiece,
          availablePieces,
          currentPlayer,
          gamePhase,
        ),
        params: QuartoSearchParameters.forMcts(mctsSearchSeedRef.current++),
        timeLimitMs: MCTS_TIME_LIMIT_MS,
        thinkingDelayMs: 0,
      });

      if (result.interrupted) {
        debugLog(enableAILoggingRef.current, '🛑 MCTS search interrupted');
        for (const line of formatMctsCoordinatorResult(result)) {
          debugLog(enableAILoggingRef.current, `📊 MCTS stats: ${line}`);
        }
        return null;
      }

      for (const line of formatMctsCoordinatorResult(result)) {
        debugLog(enableAILoggingRef.current, `📊 MCTS stats: ${line}`);
      }

      const aiMove = atomicMovesToAIMove(result.moves);

      debugLog(enableAILoggingRef.current, `🎯 MCTS AI move completed [Execution #${executionCountRef.current}] (${result.totalIterations} iterations)`);
      debugLog(
        enableAILoggingRef.current,
        `🔍 MCTS RETURNED - Place: ${aiMove.placement ? `(${aiMove.placement.row}, ${aiMove.placement.col})` : 'null'} - Give: ${aiMove.pieceToGive ? formatPieceForLogging(aiMove.pieceToGive) : 'null'}`
      );

      return aiMove;
    } catch (error) {
      debugLog(enableAILoggingRef.current, '❌ MCTS search failed:', error);
      return null;
    }
  }, [board, stagedPiece, availablePieces, currentPlayer, gamePhase]);

  const executeAIMove = useCallback(async () => {
    if (gameState !== 'playing') {
      completeAIMove();
      return;
    }

    if (!shouldAIActNow()) {
      completeAIMove();
      return;
    }

    const generation = scheduleGenerationRef.current;
    const turnPlayer = currentPlayerRef.current;
    const turnPhase = gamePhaseRef.current;
    const turnStagedPiece = stagedPieceRef.current;

    debugLog(enableAILoggingRef.current, `🎯 ======= AI MOVE START =======`);
    debugLog(enableAILoggingRef.current, `🎯 AI (Player ${turnPlayer}) executing move in phase: ${turnPhase}`);
    debugLog(enableAILoggingRef.current, `🎯 Staged piece available: ${turnStagedPiece ? formatPieceForLogging(turnStagedPiece) : 'null'} ${turnStagedPiece ? `(height:${turnStagedPiece.height}, color:${turnStagedPiece.color}, shape:${turnStagedPiece.shape}, top:${turnStagedPiece.top})` : ''}`);
    debugLog(enableAILoggingRef.current, `🎯 Available pieces count: ${availablePieces.length}`);

    let aiMove: AIMovePayload | null = null;

    try {
      if (basicAIDifficultyRef.current === 'mcts') {
        const rawMove = await executeMctsAIMove();
        aiMove =
          rawMove === null
            ? null
            : sanitizeMctsAIMoveForPhase(rawMove, turnPhase, turnStagedPiece !== null);
      } else {
        aiMove = executeBasicAIMove();
      }
    } catch (error) {
      debugLog(enableAILoggingRef.current, '❌ AI move execution failed:', error);
      completeAIMove();
      return;
    }

    if (generation !== scheduleGenerationRef.current) {
      completeAIMove();
      return;
    }

    if (!isAIPlayer(currentPlayerRef.current) || !shouldAIActNow()) {
      debugLog(enableAILoggingRef.current, '🛑 AI turn no longer valid after search — discarding move');
      completeAIMove();
      return;
    }

    if (aiMove) {
      applyAIMove(aiMove);
    } else {
      completeAIMove();
    }
  }, [
    gameState,
    availablePieces.length,
    shouldAIActNow,
    isAIPlayer,
    executeBasicAIMove,
    executeMctsAIMove,
    applyAIMove,
    completeAIMove,
  ]);

  executeAIMoveRef.current = executeAIMove;

  useEffect(() => {
    if (gameState !== 'playing' || !shouldAIActNow()) {
      return;
    }

    if (pendingExecutionRef.current || aiMoveInProgressRef.current || part2TimerRef.current !== null) {
      debugLog(enableAILoggingRef.current, '🚫 AI execution already pending or in progress, skipping...');
      return;
    }

    pendingExecutionRef.current = true;
    setAIThinking(true);
    const generation = scheduleGenerationRef.current;

    effectTimerRef.current = setTimeout(() => {
      effectTimerRef.current = null;
      if (generation !== scheduleGenerationRef.current) {
        pendingExecutionRef.current = false;
        setAIThinking(false);
        return;
      }

      if (!shouldAIActNow()) {
        pendingExecutionRef.current = false;
        setAIThinking(false);
        return;
      }

      aiMoveInProgressRef.current = true;
      void executeAIMoveRef.current();
    }, AI_THINKING_DELAY_MS);

    return () => {
      clearEffectTimer();
      if (!aiMoveInProgressRef.current && part2TimerRef.current === null) {
        scheduleGenerationRef.current += 1;
        pendingExecutionRef.current = false;
        setAIThinking(false);
      }
    };
  }, [currentPlayer, gamePhase, gameState, stagedPiece, player1AI, player2AI, basicAIDifficulty, clearEffectTimer, shouldAIActNow]);

  return {
    player1AI,
    setPlayer1AI,
    player2AI,
    setPlayer2AI,
    basicAIDifficulty,
    setBasicAIDifficulty,
    enableAILogging,
    setEnableAILogging,
    isAIThinking,
    isAIThinkingRef,
    aiTurnLockRef,
  };
}
