import { useEffect, useState } from 'react';
import { INITIAL_PLAYER } from '../constants/game';
import type { GamePhase, GameState, PieceAttributes, Player } from '../types/game';
import {
  arePiecesEqual,
  checkWinCondition,
  createEmptyBoard,
  generateAllPieces,
  getOpponent,
  getWinningLine,
  isBoardFull,
} from '../utils/gameUtils';
import type { AIResetRef, QuartoGame } from './quartoGameTypes';

export function useQuartoGame(aiResetRef: AIResetRef): QuartoGame {
  const [board, setBoard] = useState(createEmptyBoard);
  const [availablePieces, setAvailablePieces] = useState<PieceAttributes[]>(generateAllPieces);
  const [stagedPiece, setStagedPiece] = useState<PieceAttributes | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PieceAttributes | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(INITIAL_PLAYER);
  const [gamePhase, setGamePhase] = useState<GamePhase>('give');
  const [gameState, setGameState] = useState<GameState>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(null);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (checkWinCondition(board)) {
      setGameState('won');
      setWinner(currentPlayer);
      setWinningLine(getWinningLine(board));
    } else if (isBoardFull(board)) {
      setGameState('tie');
    }
  }, [board, currentPlayer, gamePhase]);

  const handlePieceSelect = (piece: PieceAttributes) => {
    if (gamePhase === 'give' && gameState === 'playing') {
      console.log(`handlePieceSelect: Player ${currentPlayer} selecting piece for Player ${getOpponent(currentPlayer)}`);

      setStagedPiece(piece);
      console.log(`Staged piece set:`, piece);

      setAvailablePieces(prev => prev.filter(p => !arePiecesEqual(p, piece)));

      setSelectedPiece(null);
      setCurrentPlayer(prev => getOpponent(prev));
      setGamePhase('place');

      console.log(`Turn switched to Player ${getOpponent(currentPlayer)}, phase: place`);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!board[row][col] && gamePhase === 'place' && stagedPiece && gameState === 'playing') {
      setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        newBoard[row][col] = stagedPiece;
        return newBoard;
      });

      setLastMove([row, col]);
      setStagedPiece(null);
      setGamePhase('give');

      console.log(`Player ${currentPlayer} placed piece at row ${row}, column ${col}`);
    } else if (board[row][col]) {
      console.log(`Cell at row ${row}, column ${col} is already occupied`);
    } else if (gamePhase === 'give') {
      console.log(`Player ${currentPlayer} must first select a piece for the opponent`);
    } else if (gameState !== 'playing') {
      console.log(`Game is over`);
    } else {
      console.log(`No piece available to place`);
    }
  };

  const startNewGame = () => {
    setBoard(createEmptyBoard());
    setAvailablePieces(generateAllPieces());
    setSelectedPiece(null);
    setStagedPiece(null);
    setCurrentPlayer(INITIAL_PLAYER);
    setGamePhase('give');
    setGameState('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);

    aiResetRef.current?.();
  };

  const getGameStatusMessage = () => {
    if (gameState === 'won') {
      return `Game Over`;
    }
    if (gameState === 'tie') {
      return `Game Over`;
    }
    if (gamePhase === 'give') {
      return `Player ${currentPlayer}: Select an available piece for Player ${getOpponent(currentPlayer)} to place`;
    }
    return `Player ${currentPlayer}: Place this piece on the board`;
  };

  return {
    board,
    availablePieces,
    stagedPiece,
    selectedPiece,
    currentPlayer,
    gamePhase,
    gameState,
    winner,
    winningLine,
    lastMove,
    setBoard,
    setAvailablePieces,
    setStagedPiece,
    setCurrentPlayer,
    setGamePhase,
    setLastMove,
    handlePieceSelect,
    handleCellClick,
    startNewGame,
    getGameStatusMessage,
  };
}
