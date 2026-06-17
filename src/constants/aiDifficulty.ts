import type { AIDifficulty } from '../types/game';

export const AI_DIFFICULTY_OPTIONS: { value: AIDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
  { value: 'brutal', label: 'Brutal' },
  { value: 'mcts', label: 'MCTS' },
];
