import { describe, expect, it } from 'vitest';
import { BOARD_SIZE } from '../constants/game';
import type { Board, PieceAttributes } from '../types/game';
import {
  arePiecesEqual,
  checkWinCondition,
  createEmptyBoard,
  generateAllPieces,
  getOpponent,
  getPieceId,
  getWinningLine,
  isBoardFull,
} from './gameUtils';

const piece = (overrides: Partial<PieceAttributes> = {}): PieceAttributes => ({
  height: 'tall',
  color: 'light',
  shape: 'square',
  top: 'smooth',
  ...overrides,
});

const setCell = (board: Board, row: number, col: number, cell: PieceAttributes | null): Board => {
  const next = board.map(r => [...r]);
  next[row][col] = cell;
  return next;
};

describe('generateAllPieces', () => {
  it('returns 16 unique pieces', () => {
    const pieces = generateAllPieces();
    const ids = new Set(pieces.map(getPieceId));

    expect(pieces).toHaveLength(16);
    expect(ids.size).toBe(16);
  });
});

describe('arePiecesEqual', () => {
  it('matches pieces with the same attributes', () => {
    const a = piece({ height: 'short', color: 'dark' });
    const b = piece({ height: 'short', color: 'dark' });

    expect(arePiecesEqual(a, b)).toBe(true);
  });

  it('does not match pieces with different attributes', () => {
    expect(arePiecesEqual(piece({ height: 'tall' }), piece({ height: 'short' }))).toBe(false);
  });
});

describe('createEmptyBoard', () => {
  it('creates a BOARD_SIZE x BOARD_SIZE grid of null cells', () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(BOARD_SIZE);
    expect(board.every(row => row.length === BOARD_SIZE && row.every(cell => cell === null))).toBe(true);
  });
});

describe('getOpponent', () => {
  it('returns the other player', () => {
    expect(getOpponent(1)).toBe(2);
    expect(getOpponent(2)).toBe(1);
  });
});

describe('checkWinCondition', () => {
  it('detects a row win', () => {
    let board = createEmptyBoard();
    board = setCell(board, 0, 0, piece({ height: 'tall', color: 'light' }));
    board = setCell(board, 0, 1, piece({ height: 'tall', color: 'dark' }));
    board = setCell(board, 0, 2, piece({ height: 'tall', shape: 'round' }));
    board = setCell(board, 0, 3, piece({ height: 'tall', top: 'split' }));

    expect(checkWinCondition(board)).toBe(true);
  });

  it('detects a column win', () => {
    let board = createEmptyBoard();
    board = setCell(board, 0, 0, piece({ color: 'light', height: 'tall' }));
    board = setCell(board, 1, 0, piece({ color: 'light', height: 'short' }));
    board = setCell(board, 2, 0, piece({ color: 'light', shape: 'round' }));
    board = setCell(board, 3, 0, piece({ color: 'light', top: 'split' }));

    expect(checkWinCondition(board)).toBe(true);
  });

  it('detects a main diagonal win', () => {
    let board = createEmptyBoard();
    board = setCell(board, 0, 0, piece({ shape: 'square', height: 'tall' }));
    board = setCell(board, 1, 1, piece({ shape: 'square', color: 'dark' }));
    board = setCell(board, 2, 2, piece({ shape: 'square', top: 'split' }));
    board = setCell(board, 3, 3, piece({ shape: 'square', height: 'short' }));

    expect(checkWinCondition(board)).toBe(true);
  });

  it('detects an anti-diagonal win', () => {
    let board = createEmptyBoard();
    board = setCell(board, 0, 3, piece({ top: 'smooth', height: 'tall' }));
    board = setCell(board, 1, 2, piece({ top: 'smooth', color: 'dark' }));
    board = setCell(board, 2, 1, piece({ top: 'smooth', shape: 'round' }));
    board = setCell(board, 3, 0, piece({ top: 'smooth', height: 'short' }));

    expect(checkWinCondition(board)).toBe(true);
  });

  it('does not false-positive on three matching pieces in a row', () => {
    let board = createEmptyBoard();
    board = setCell(board, 0, 0, piece({ height: 'tall' }));
    board = setCell(board, 0, 1, piece({ height: 'tall' }));
    board = setCell(board, 0, 2, piece({ height: 'tall' }));

    expect(checkWinCondition(board)).toBe(false);
  });

  it('does not false-positive when four pieces share no common attribute', () => {
    let board = createEmptyBoard();
    board = setCell(board, 0, 0, piece({ height: 'tall', color: 'light', shape: 'square', top: 'smooth' }));
    board = setCell(board, 0, 1, piece({ height: 'short', color: 'dark', shape: 'round', top: 'split' }));
    board = setCell(board, 0, 2, piece({ height: 'tall', color: 'dark', shape: 'square', top: 'split' }));
    board = setCell(board, 0, 3, piece({ height: 'short', color: 'light', shape: 'round', top: 'smooth' }));

    expect(checkWinCondition(board)).toBe(false);
  });
});

describe('getWinningLine', () => {
  it('returns null when there is no win', () => {
    expect(getWinningLine(createEmptyBoard())).toBeNull();
  });

  it('returns coordinates that match checkWinCondition for the same board', () => {
    let board = createEmptyBoard();
    board = setCell(board, 2, 0, piece({ height: 'short' }));
    board = setCell(board, 2, 1, piece({ height: 'short', color: 'dark' }));
    board = setCell(board, 2, 2, piece({ height: 'short', shape: 'round' }));
    board = setCell(board, 2, 3, piece({ height: 'short', top: 'split' }));

    expect(checkWinCondition(board)).toBe(true);

    const line = getWinningLine(board);
    expect(line).not.toBeNull();
    expect(line).toEqual([
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ]);

    for (const [row, col] of line!) {
      expect(board[row][col]).not.toBeNull();
    }
  });
});

describe('isBoardFull', () => {
  it('returns false for an empty board', () => {
    expect(isBoardFull(createEmptyBoard())).toBe(false);
  });

  it('returns true when every cell is occupied', () => {
    const pieces = generateAllPieces();
    let board = createEmptyBoard();
    let index = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        board = setCell(board, row, col, pieces[index++]);
      }
    }

    expect(isBoardFull(board)).toBe(true);
  });
});
