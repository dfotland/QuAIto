import { describe, expect, it } from 'vitest';
import { appPlayerToMcts } from '@smart-games/mcts';

import { atomicMovesToAIMove, sanitizeMctsAIMoveForPhase } from './parse-move';
import { serializeQuartoGameState } from './serialize-state';
import { createEmptyBoard, generateAllPieces } from '../utils/gameUtils';

describe('serializeQuartoGameState', () => {
  it('maps QuAIto player ids to zero-based MCTS player ids', () => {
    const state = serializeQuartoGameState(
      createEmptyBoard(),
      null,
      generateAllPieces(),
      2,
      'give',
    );

    expect(state.currentPlayer).toBe(appPlayerToMcts(2));
    expect(state.currentPhase).toBe('give');
    expect(state.availablePieces).toHaveLength(16);
  });
});

describe('sanitizeMctsAIMoveForPhase', () => {
  const piece = {
    height: 'short' as const,
    color: 'dark' as const,
    shape: 'round' as const,
    top: 'split' as const,
  };

  it('allows give-only moves in give phase', () => {
    const move = sanitizeMctsAIMoveForPhase(
      { placement: { row: 0, col: 0 }, pieceToGive: piece },
      'give',
      false,
    );
    expect(move).toEqual({ placement: null, pieceToGive: piece });
  });

  it('rejects placement when opponent has the staged piece', () => {
    const move = sanitizeMctsAIMoveForPhase(
      { placement: { row: 1, col: 1 }, pieceToGive: null },
      'place',
      false,
    );
    expect(move).toBeNull();
  });
});

describe('atomicMovesToAIMove', () => {
  it('extracts place and give moves from coordinator output', () => {
    const piece = {
      height: 'short' as const,
      color: 'dark' as const,
      shape: 'round' as const,
      top: 'split' as const,
    };

    const aiMove = atomicMovesToAIMove([
      {
        move: { row: 1, col: 2 },
        moveKey: 'place:0:1,2',
        player: 0,
        phase: 'place',
        iterations: 10,
        stopped: false,
        elapsedMs: 1,
      },
      {
        move: { piece },
        moveKey: 'give:0:short-dark-round-split',
        player: 0,
        phase: 'give',
        iterations: 8,
        stopped: false,
        elapsedMs: 1,
      },
    ]);

    expect(aiMove.placement).toEqual({ row: 1, col: 2 });
    expect(aiMove.pieceToGive).toEqual(piece);
  });
});
