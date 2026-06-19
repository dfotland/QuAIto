import { describe, expect, it, vi } from 'vitest';

import { enrichMctsMoveWithGiveFallback } from './enrich-mcts-move';
import { createEmptyBoard, generateAllPieces } from '../utils/gameUtils';

const piece = {
  height: 'short' as const,
  color: 'dark' as const,
  shape: 'round' as const,
  top: 'split' as const,
};

describe('enrichMctsMoveWithGiveFallback', () => {
  it('returns give-only moves unchanged in give phase', () => {
    const move = enrichMctsMoveWithGiveFallback(
      { placement: null, pieceToGive: piece },
      {
        turnPhase: 'give',
        turnStagedPiece: null,
        board: createEmptyBoard(),
        availablePieces: generateAllPieces(),
        currentPlayer: 1,
      },
    );

    expect(move).toEqual({ placement: null, pieceToGive: piece });
  });

  it('returns full place moves unchanged when give is already present', () => {
    const move = enrichMctsMoveWithGiveFallback(
      { placement: { row: 0, col: 0 }, pieceToGive: piece },
      {
        turnPhase: 'place',
        turnStagedPiece: piece,
        board: createEmptyBoard(),
        availablePieces: generateAllPieces(),
        currentPlayer: 2,
      },
    );

    expect(move.pieceToGive).toEqual(piece);
  });

  it('adds a heuristic give when MCTS returns placement only on a non-terminal board', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const availablePieces = generateAllPieces();
    const move = enrichMctsMoveWithGiveFallback(
      { placement: { row: 1, col: 1 }, pieceToGive: null },
      {
        turnPhase: 'place',
        turnStagedPiece: piece,
        board: createEmptyBoard(),
        availablePieces,
        currentPlayer: 2,
      },
    );

    expect(move.placement).toEqual({ row: 1, col: 1 });
    expect(move.pieceToGive).not.toBeNull();
    expect(availablePieces.some((p) => p === move.pieceToGive)).toBe(true);

    vi.restoreAllMocks();
  });
});
