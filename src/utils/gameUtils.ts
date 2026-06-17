import { BOARD_SIZE } from '../constants/game';
import { type Board, type PieceAttributes, type Player } from '../types/game';

// Generate all 16 unique Quarto pieces
export const generateAllPieces = (): PieceAttributes[] => {
  const pieces: PieceAttributes[] = [];

  const heights: ('tall' | 'short')[] = ['tall', 'short'];
  const colors: ('light' | 'dark')[] = ['light', 'dark'];
  const shapes: ('square' | 'round')[] = ['square', 'round'];
  const tops: ('smooth' | 'split')[] = ['smooth', 'split'];

  // Generate all possible combinations (2^4 = 16 pieces)
  for (const height of heights) {
    for (const color of colors) {
      for (const shape of shapes) {
        for (const top of tops) {
          pieces.push({ height, color, shape, top });
        }
      }
    }
  }

  return pieces;
};

export const createEmptyBoard = (): Board =>
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

export const getOpponent = (player: Player): Player => (player === 1 ? 2 : 1);

// Get a unique identifier for a piece
export const getPieceId = (piece: PieceAttributes): string => {
  return `${piece.height}-${piece.color}-${piece.shape}-${piece.top}`;
};

// Check if two pieces are the same
export const arePiecesEqual = (piece1: PieceAttributes, piece2: PieceAttributes): boolean => {
  return getPieceId(piece1) === getPieceId(piece2);
};

// Format a piece for logging (shows full attribute names)
export const formatPieceForLogging = (piece: PieceAttributes): string => {
  const height = piece.height === 'tall' ? 'Tall' : 'Short';
  const top = piece.top === 'smooth' ? 'Smooth' : 'Split';
  const color = piece.color === 'dark' ? 'Dark' : 'Light';
  const shape = piece.shape === 'square' ? 'Square' : 'Round';
  return `${height}/${top}/${color}/${shape}`;
};

// Check if four pieces share a common attribute
const checkLine = (pieces: PieceAttributes[]): boolean => {
  if (pieces.length !== BOARD_SIZE) return false;

  const sameHeight = pieces.every(p => p.height === pieces[0].height);
  const sameColor = pieces.every(p => p.color === pieces[0].color);
  const sameShape = pieces.every(p => p.shape === pieces[0].shape);
  const sameTop = pieces.every(p => p.top === pieces[0].top);

  return sameHeight || sameColor || sameShape || sameTop;
};

const collectLinePieces = (board: Board, positions: [number, number][]): PieceAttributes[] => {
  const pieces: PieceAttributes[] = [];
  for (const [row, col] of positions) {
    const piece = board[row][col];
    if (piece) {
      pieces.push(piece);
    }
  }
  return pieces;
};

const findWinningLineOnBoard = (board: Board): [number, number][] | null => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    const positions: [number, number][] = Array.from({ length: BOARD_SIZE }, (_, col) => [row, col]);
    const pieces = collectLinePieces(board, positions);
    if (pieces.length === BOARD_SIZE && checkLine(pieces)) {
      return positions;
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    const positions: [number, number][] = Array.from({ length: BOARD_SIZE }, (_, row) => [row, col]);
    const pieces = collectLinePieces(board, positions);
    if (pieces.length === BOARD_SIZE && checkLine(pieces)) {
      return positions;
    }
  }

  const mainDiagonal: [number, number][] = Array.from({ length: BOARD_SIZE }, (_, i) => [i, i]);
  const mainDiagonalPieces = collectLinePieces(board, mainDiagonal);
  if (mainDiagonalPieces.length === BOARD_SIZE && checkLine(mainDiagonalPieces)) {
    return mainDiagonal;
  }

  const antiDiagonal: [number, number][] = Array.from(
    { length: BOARD_SIZE },
    (_, i) => [i, BOARD_SIZE - 1 - i]
  );
  const antiDiagonalPieces = collectLinePieces(board, antiDiagonal);
  if (antiDiagonalPieces.length === BOARD_SIZE && checkLine(antiDiagonalPieces)) {
    return antiDiagonal;
  }

  return null;
};

// Check for win condition on the board
export const checkWinCondition = (board: Board): boolean => findWinningLineOnBoard(board) !== null;

// Check if the board is full (tie condition)
export const isBoardFull = (board: Board): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// Get winning line for highlighting (returns positions of winning pieces)
export const getWinningLine = (board: Board): [number, number][] | null => findWinningLineOnBoard(board);
