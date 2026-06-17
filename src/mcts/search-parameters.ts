import { SearchParameters } from '@smart-games/mcts';

export const MCTS_TIME_LIMIT_MS = 2000;

let searchCounter = 0;

export class QuartoSearchParameters extends SearchParameters {
  static forMcts(seed?: number): QuartoSearchParameters {
    const nextSeed = seed ?? ((Date.now() + searchCounter++) & 0xffffffff);
    return new QuartoSearchParameters({
      explorationConstant: 1.4,
      maxIterations: 1_000_000,
      maxRolloutPlies: 80,
      seed: nextSeed,
      heuristicId: 'quarto-basic',
      stopPollInterval: 32,
    });
  }
}
