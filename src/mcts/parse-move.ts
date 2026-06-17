import type { AtomicMoveResult } from '@smart-games/mcts';
import type { GamePhase, PieceAttributes } from '../types/game';

export interface ParsedMctsAIMove {
  placement: { row: number; col: number } | null;
  pieceToGive: PieceAttributes | null;
}

export function atomicMovesToAIMove(moves: AtomicMoveResult[]): ParsedMctsAIMove {
  const placeMove = moves.find((move) => move.phase === 'place');
  const giveMove = moves.find((move) => move.phase === 'give');

  return {
    placement:
      placeMove && typeof placeMove.move.row === 'number' && typeof placeMove.move.col === 'number'
        ? { row: placeMove.move.row, col: placeMove.move.col }
        : null,
    pieceToGive: giveMove ? (giveMove.move.piece as PieceAttributes) : null,
  };
}

/** Keep only actions legal for the current UI phase (guards stale async MCTS results). */
export function sanitizeMctsAIMoveForPhase(
  aiMove: ParsedMctsAIMove,
  gamePhase: GamePhase,
  hasStagedPiece: boolean,
): ParsedMctsAIMove | null {
  if (gamePhase === 'give') {
    if (!aiMove.pieceToGive) return null;
    return { placement: null, pieceToGive: aiMove.pieceToGive };
  }

  if (gamePhase === 'place' && hasStagedPiece) {
    return aiMove;
  }

  return null;
}
