import { useCallback, useRef } from 'react';
import type { PieceAttributes, Player } from '../types/game';
import type { AIThinkingRef, HumanInputGuardRef } from './quartoGameTypes';

interface HumanInteractionOptions {
  gameState: 'playing' | 'won' | 'tie';
  currentPlayer: Player;
  player1AI: boolean;
  player2AI: boolean;
  isAIThinking: boolean;
  isAIThinkingRef: AIThinkingRef;
  /** Sync ref updated each render; blocks input while AI scheduling/search is active. */
  aiTurnLockRef?: HumanInputGuardRef;
}

function isAIPlayer(
  player: Player,
  player1AI: boolean,
  player2AI: boolean,
): boolean {
  return (player === 1 && player1AI) || (player === 2 && player2AI);
}

export function useHumanInteraction({
  gameState,
  currentPlayer,
  player1AI,
  player2AI,
  isAIThinking,
  isAIThinkingRef,
  aiTurnLockRef,
}: HumanInteractionOptions) {
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const currentPlayerRef = useRef(currentPlayer);
  currentPlayerRef.current = currentPlayer;
  const player1AIRef = useRef(player1AI);
  player1AIRef.current = player1AI;
  const player2AIRef = useRef(player2AI);
  player2AIRef.current = player2AI;

  const currentPlayerIsAI = isAIPlayer(currentPlayer, player1AI, player2AI);

  /** Reads latest turn/AI flags from refs so clicks cannot slip through before re-render. */
  const canHumanInteractNow = useCallback(() => {
    if (gameStateRef.current !== 'playing') return false;
    const player = currentPlayerRef.current;
    if (isAIPlayer(player, player1AIRef.current, player2AIRef.current)) return false;
    if (isAIThinkingRef.current) return false;
    if (aiTurnLockRef?.current()) return false;
    return true;
  }, [isAIThinkingRef, aiTurnLockRef]);

  const canHumanInteract =
    gameState === 'playing' && !currentPlayerIsAI && !isAIThinking;

  const guardHumanAction = useCallback(
    (action: () => void) => {
      if (!canHumanInteractNow()) return;
      action();
    },
    [canHumanInteractNow],
  );

  const guardCellClick = useCallback(
    (action: (row: number, col: number) => void, row: number, col: number) => {
      if (!canHumanInteractNow()) return;
      action(row, col);
    },
    [canHumanInteractNow],
  );

  const guardPieceSelect = useCallback(
    (action: (piece: PieceAttributes) => void, piece: PieceAttributes) => {
      if (!canHumanInteractNow()) return;
      action(piece);
    },
    [canHumanInteractNow],
  );

  return {
    canHumanInteract,
    isCurrentPlayerAI: currentPlayerIsAI,
    canHumanInteractNow,
    guardCellClick,
    guardPieceSelect,
    guardHumanAction,
  };
}
