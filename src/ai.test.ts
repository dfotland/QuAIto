import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AIInput } from './ai';
import { makeAIMove, makeAIPlacement, makeAIPieceSelection } from './ai';
import type { Board, PieceAttributes } from './types/game';
import { arePiecesEqual, createEmptyBoard, generateAllPieces } from './utils/gameUtils';

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

const baseInput = (overrides: Partial<AIInput> = {}): AIInput => ({
  currentPlayer: 1,
  gamePhase: 'place',
  board: createEmptyBoard(),
  availablePieces: generateAllPieces(),
  enableLogging: false,
  difficulty: 'brutal',
  ...overrides,
});

/** Row 0 cols 0–2 filled with tall pieces; (0,3) completes a height win. */
const rowWinSetup = () => {
  let board = createEmptyBoard();
  board = setCell(board, 0, 0, piece({ height: 'tall', color: 'light', shape: 'square', top: 'smooth' }));
  board = setCell(board, 0, 1, piece({ height: 'tall', color: 'dark', shape: 'round', top: 'split' }));
  board = setCell(board, 0, 2, piece({ height: 'tall', color: 'light', shape: 'round', top: 'smooth' }));

  const pieceToPlace = piece({ height: 'tall', color: 'dark', shape: 'square', top: 'split' });

  return { board, pieceToPlace };
};

/** Row 0 cols 0–2 tall; giving another tall piece lets opponent win at (0,3). */
const dangerousPieceSetup = () => {
  const { board } = rowWinSetup();
  const dangerousPiece = piece({ height: 'tall', color: 'light', shape: 'round', top: 'split' });
  const safePiece = piece({ height: 'short', color: 'light', shape: 'square', top: 'smooth' });

  return { board, dangerousPiece, safePiece };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('makeAIPlacement', () => {
  it('takes a winning placement when one is available', () => {
    const { board, pieceToPlace } = rowWinSetup();

    const placement = makeAIPlacement(
      baseInput({
        board,
        pieceToPlace,
        gamePhase: 'place',
      })
    );

    expect(placement).toEqual({ row: 0, col: 3 });
  });
});

describe('makeAIPieceSelection', () => {
  it('prefers a safe piece over a dangerous piece', () => {
    const { board, dangerousPiece, safePiece } = dangerousPieceSetup();

    const selected = makeAIPieceSelection(
      baseInput({
        board,
        availablePieces: [dangerousPiece, safePiece],
        gamePhase: 'give',
        pieceToPlace: null,
      })
    );

    expect(selected).not.toBeNull();
    expect(arePiecesEqual(selected!, safePiece)).toBe(true);
    expect(arePiecesEqual(selected!, dangerousPiece)).toBe(false);
  });
});

describe('makeAIMove', () => {
  it('returns pieceToGive null when placement wins the game', () => {
    const { board, pieceToPlace } = rowWinSetup();

    const move = makeAIMove(
      baseInput({
        board,
        pieceToPlace,
        gamePhase: 'place',
      })
    );

    expect(move.placement).toEqual({ row: 0, col: 3 });
    expect(move.pieceToGive).toBeNull();
  });
});
