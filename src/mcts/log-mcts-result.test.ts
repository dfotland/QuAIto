import { describe, expect, it } from 'vitest';
import type { CoordinatorMoveResult } from '@smart-games/mcts';

import { formatMctsAtomicMoveStats, formatMctsCoordinatorResult } from './log-mcts-result';

describe('formatMctsCoordinatorResult', () => {
  const sampleResult: CoordinatorMoveResult = {
    moves: [
      {
        move: { piece: { height: 'short', color: 'dark', shape: 'round', top: 'split' } },
        moveKey: 'give:0:short-dark-round-split',
        player: 0,
        phase: 'give',
        iterations: 120,
        stopped: true,
        elapsedMs: 1300,
        statistics: {
          nodesExpanded: 84,
          maxDepth: 6,
          bestMoveWinRate: 0.625,
        },
      },
    ],
    resultingState: {},
    totalIterations: 120,
    totalElapsedMs: 1300,
    totalNodesExpanded: 84,
    maxSearchDepth: 6,
    interrupted: false,
  };

  it('formats per-ply and total statistics', () => {
    const lines = formatMctsCoordinatorResult(sampleResult);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('nodes=84');
    expect(lines[0]).toContain('depth=6');
    expect(lines[0]).toContain('winRate=62.5%');
    expect(lines[1]).toContain('totals');
    expect(lines[1]).toContain('maxDepth=6');
  });

  it('formats atomic move stats line', () => {
    const line = formatMctsAtomicMoveStats(sampleResult.moves[0]!, 0);
    expect(line).toContain('ply 1 (give)');
    expect(line).toContain('stopped');
  });
});
