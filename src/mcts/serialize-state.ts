import { appPlayerToMcts } from '@smart-games/mcts';
import type { Board, GamePhase, PieceAttributes, Player } from '../types/game';

export function serializeQuartoGameState(
  board: Board,
  stagedPiece: PieceAttributes | null,
  availablePieces: PieceAttributes[],
  currentPlayer: Player,
  gamePhase: GamePhase,
) {
  return {
    cells: board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    currentPlayer: appPlayerToMcts(currentPlayer),
    currentPhase: gamePhase,
    availablePieces: availablePieces.map((piece) => ({ ...piece })),
    stagedPiece: stagedPiece ? { ...stagedPiece } : null,
  };
}
