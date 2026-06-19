import type { AtomicMoveResult, CoordinatorMoveResult } from '@smart-games/mcts';
import { formatSearchProfile } from '@smart-games/mcts';

function formatWinRate(winRate: number | null): string {
  return winRate === null ? 'n/a' : `${(winRate * 100).toFixed(1)}%`;
}

export function formatMctsAtomicMoveStats(move: AtomicMoveResult, plyIndex: number): string[] {
  const { statistics: stats } = move;
  const lines = [
    [
      `ply ${plyIndex + 1} (${move.phase})`,
      `move=${move.moveKey}`,
      `iterations=${move.iterations}`,
      `nodes=${stats.nodesExpanded}`,
      `depth=${stats.maxDepth}`,
      `winRate=${formatWinRate(stats.bestMoveWinRate)}`,
      `elapsed=${move.elapsedMs.toFixed(0)}ms`,
      move.stopped ? 'stopped' : 'complete',
    ].join(', '),
  ];

  if (stats.profile !== undefined) {
    lines.push(formatSearchProfile(stats.profile, `MCTS profile ply ${plyIndex + 1}`));
  }

  return lines;
}

export function formatMctsCoordinatorResult(result: CoordinatorMoveResult): string[] {
  const lines = result.moves.flatMap((move, index) => formatMctsAtomicMoveStats(move, index));

  const iterPerSec =
    result.totalElapsedMs > 0
      ? Math.round(result.totalIterations / (result.totalElapsedMs / 1000))
      : 'n/a';

  lines.push(
    [
      'totals',
      `plies=${result.moves.length}`,
      `iterations=${result.totalIterations}`,
      `nodes=${result.totalNodesExpanded}`,
      `maxDepth=${result.maxSearchDepth}`,
      `elapsed=${result.totalElapsedMs.toFixed(0)}ms`,
      `iterPerSec=${iterPerSec}`,
      result.interrupted ? 'interrupted' : 'complete',
    ].join(', '),
  );

  return lines;
}
