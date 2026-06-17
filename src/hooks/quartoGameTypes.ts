import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Board, GamePhase, GameState, PieceAttributes, Player } from '../types/game';

export interface QuartoGame {
  board: Board;
  availablePieces: PieceAttributes[];
  stagedPiece: PieceAttributes | null;
  selectedPiece: PieceAttributes | null;
  currentPlayer: Player;
  gamePhase: GamePhase;
  gameState: GameState;
  winner: Player | null;
  winningLine: [number, number][] | null;
  lastMove: [number, number] | null;
  setBoard: Dispatch<SetStateAction<Board>>;
  setAvailablePieces: Dispatch<SetStateAction<PieceAttributes[]>>;
  setStagedPiece: Dispatch<SetStateAction<PieceAttributes | null>>;
  setCurrentPlayer: Dispatch<SetStateAction<Player>>;
  setGamePhase: Dispatch<SetStateAction<GamePhase>>;
  setLastMove: Dispatch<SetStateAction<[number, number] | null>>;
  handlePieceSelect: (piece: PieceAttributes) => void;
  handleCellClick: (row: number, col: number) => void;
  startNewGame: () => void;
  getGameStatusMessage: () => string;
}

export type AIResetRef = MutableRefObject<(() => void) | null>;
