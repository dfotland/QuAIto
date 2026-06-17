export interface PieceAttributes {
  height: 'tall' | 'short';
  color: 'light' | 'dark';
  shape: 'square' | 'round';
  top: 'smooth' | 'split';
}

export type Player = 1 | 2;
export type GamePhase = 'place' | 'give';
export type GameState = 'playing' | 'won' | 'tie';
export type HeuristicAIDifficulty = 'easy' | 'normal' | 'hard' | 'brutal';
export type AIDifficulty = HeuristicAIDifficulty | 'mcts';
export type Board = (PieceAttributes | null)[][];
