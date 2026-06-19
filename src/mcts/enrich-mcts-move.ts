import { makeAIPieceSelection } from '../ai';
import type { Board, GamePhase, PieceAttributes, Player } from '../types/game';
import { checkWinCondition } from '../utils/gameUtils';
import type { ParsedMctsAIMove } from './parse-move';

const MCTS_GIVE_FALLBACK_DIFFICULTY = 'normal' as const;

export function enrichMctsMoveWithGiveFallback(
  aiMove: ParsedMctsAIMove,
  options: {
    turnPhase: GamePhase;
    turnStagedPiece: PieceAttributes | null;
    board: Board;
    availablePieces: PieceAttributes[];
    currentPlayer: Player;
    enableLogging?: boolean;
  },
): ParsedMctsAIMove {
  const {
    turnPhase,
    turnStagedPiece,
    board,
    availablePieces,
    currentPlayer,
    enableLogging = false,
  } = options;

  if (
    turnPhase !== 'place' ||
    turnStagedPiece === null ||
    aiMove.placement === null ||
    aiMove.pieceToGive !== null
  ) {
    return aiMove;
  }

  const testBoard = board.map((row) => [...row]);
  testBoard[aiMove.placement.row][aiMove.placement.col] = turnStagedPiece;

  if (checkWinCondition(testBoard)) {
    return { placement: aiMove.placement, pieceToGive: null };
  }

  const pieceToGive = makeAIPieceSelection({
    currentPlayer,
    gamePhase: 'give',
    board: testBoard,
    pieceToPlace: null,
    availablePieces,
    enableLogging,
    difficulty: MCTS_GIVE_FALLBACK_DIFFICULTY,
  });

  if (pieceToGive === null) {
    return aiMove;
  }

  return { placement: aiMove.placement, pieceToGive };
}
