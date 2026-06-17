import { BOARD_SIZE } from './constants/game';
import { type AIDifficulty, type Board, type PieceAttributes, type Player } from './types/game';
import { checkWinCondition, formatPieceForLogging } from './utils/gameUtils';
import { debugLog } from './utils/logger';

// AI Win Check Miss Probabilities (chance to miss obvious wins)
const EASY_WIN_MISS_CHANCE = 0.5;
const NORMAL_WIN_MISS_CHANCE = 0.2;
const HARD_WIN_MISS_CHANCE = 0.05;
const BRUTAL_WIN_MISS_CHANCE = 0;

// AI Difficulty Random move or random piece to giveChances
const EASY_RANDOM_CHANCE = 0.4;
const NORMAL_RANDOM_CHANCE = 0.2;
const HARD_RANDOM_CHANCE = 0.1;
const BRUTAL_RANDOM_CHANCE = 0;

// AI Minimum Safe Pieces Thresholds (pieces that don't give opponent immediate wins)
const EASY_MIN_SAFE_PIECES = 2;
const NORMAL_MIN_SAFE_PIECES = 2;
const HARD_MIN_SAFE_PIECES = 3;
const BRUTAL_MIN_SAFE_PIECES = 8;

export interface BoardPosition {
  row: number;
  col: number;
}

export interface AIInput {
  currentPlayer: Player;
  gamePhase: 'give' | 'place';
  board: Board;
  pieceToPlace?: PieceAttributes | null;
  availablePieces: PieceAttributes[];
  enableLogging?: boolean;
  difficulty?: AIDifficulty;
}

export interface AIMove {
  placement: BoardPosition | null;
  pieceToGive: PieceAttributes | null;
}

function getRandomChance(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy': return EASY_RANDOM_CHANCE;
    case 'normal': return NORMAL_RANDOM_CHANCE;
    case 'hard': return HARD_RANDOM_CHANCE;
    case 'brutal': return BRUTAL_RANDOM_CHANCE;
    default: return NORMAL_RANDOM_CHANCE;
  }
}

function getMinSafePieces(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy': return EASY_MIN_SAFE_PIECES;
    case 'normal': return NORMAL_MIN_SAFE_PIECES;
    case 'hard': return HARD_MIN_SAFE_PIECES;
    case 'brutal': return BRUTAL_MIN_SAFE_PIECES;
    default: return NORMAL_MIN_SAFE_PIECES;
  }
}

function getEmptyPositions(board: Board): BoardPosition[] {
  const emptyPositions: BoardPosition[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        emptyPositions.push({ row, col });
      }
    }
  }

  return emptyPositions;
}

function getRandomElement<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function canPieceLeadToWin(piece: PieceAttributes, board: Board, enableLogging: boolean = false): boolean {
  const emptyPositions = getEmptyPositions(board);

  debugLog(
    enableLogging,
    `  🔍 Testing piece ${formatPieceForLogging(piece)} (${piece.height}, ${piece.color}, ${piece.shape}, ${piece.top}) on ${emptyPositions.length} empty positions...`
  );

  for (const position of emptyPositions) {
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = piece;

    if (checkWinCondition(testBoard)) {
      debugLog(
        enableLogging,
        `  ⚠️ DANGEROUS: Piece ${formatPieceForLogging(piece)} at (${position.col},${position.row}) creates winning line!`
      );
      return true;
    }
  }

  debugLog(enableLogging, `  ✅ Safe: Piece ${formatPieceForLogging(piece)} doesn't create winning line`);

  return false;
}

export function makeAIPlacement(input: AIInput): BoardPosition | null {
  const { board, pieceToPlace, enableLogging = false, difficulty = 'normal' } = input;

  debugLog(enableLogging, `🔵 Basic AI (${difficulty}): Evaluating placement options...`);

  if (!pieceToPlace) {
    debugLog(enableLogging, '🔵 Basic AI: No piece to place (first move)');
    return null;
  }

  const emptyPositions = getEmptyPositions(board);
  if (emptyPositions.length === 0) {
    debugLog(enableLogging, '🔵 Basic AI: No empty positions available');
    return null;
  }

  debugLog(enableLogging, `🔵 Basic AI: Found ${emptyPositions.length} empty positions`);
  debugLog(enableLogging, '🔵 Basic AI: Checking for winning moves...');

  const winCheckSkipMap: Record<AIDifficulty, number> = {
    easy: EASY_WIN_MISS_CHANCE,
    normal: NORMAL_WIN_MISS_CHANCE,
    hard: HARD_WIN_MISS_CHANCE,
    brutal: BRUTAL_WIN_MISS_CHANCE,
  };

  const shouldSkipWinCheck = Math.random() < winCheckSkipMap[difficulty];

  if (!shouldSkipWinCheck) {
    for (const position of emptyPositions) {
      const testBoard = board.map(row => [...row]);
      testBoard[position.row][position.col] = pieceToPlace;

      if (checkWinCondition(testBoard)) {
        debugLog(enableLogging, `🏆 Basic AI: Found winning move at (${position.col},${position.row})!`);
        return position;
      }
    }
  } else {
    debugLog(
      enableLogging,
      `😴 Basic AI (${difficulty}): Skipping win check (${(winCheckSkipMap[difficulty] * 100).toFixed(1)}% chance) - being less optimal`
    );
  }

  const randomChance = getRandomChance(difficulty);
  if (Math.random() < randomChance) {
    const randomPosition = getRandomElement(emptyPositions);
    debugLog(
      enableLogging,
      `🎲 Basic AI (${difficulty}): Making random placement at (${randomPosition.col},${randomPosition.row})`
    );
    return randomPosition;
  }

  debugLog(enableLogging, '🧠 Basic AI: No winning move found, evaluating positions for maximum safe pieces...');

  const minSafePieces = getMinSafePieces(difficulty);
  let bestPositions: BoardPosition[] = [];
  let maxSafePieces = -1;
  const positionsAboveThreshold: BoardPosition[] = [];

  for (const position of emptyPositions) {
    const testBoard = board.map(row => [...row]);
    testBoard[position.row][position.col] = pieceToPlace;

    const safePiecesCount = input.availablePieces.filter(piece => {
      return !canPieceLeadToWin(piece, testBoard, false);
    }).length;

    debugLog(
      enableLogging,
      `  📊 Position (${position.col},${position.row}): ${safePiecesCount} safe pieces (min required: ${minSafePieces})`
    );

    if (safePiecesCount >= minSafePieces) {
      positionsAboveThreshold.push(position);
    }

    if (safePiecesCount > maxSafePieces) {
      maxSafePieces = safePiecesCount;
      bestPositions = [position];
    } else if (safePiecesCount === maxSafePieces) {
      bestPositions.push(position);
    }
  }

  let selectedPosition: BoardPosition;

  if (positionsAboveThreshold.length > 0) {
    selectedPosition = getRandomElement(positionsAboveThreshold);
    debugLog(
      enableLogging,
      `🎯 Basic AI: Found ${positionsAboveThreshold.length} positions meeting minimum ${minSafePieces} safe pieces, randomly selected (${selectedPosition.col},${selectedPosition.row})`
    );
  } else {
    selectedPosition = getRandomElement(bestPositions);
    debugLog(
      enableLogging,
      `⚠️ Basic AI: No positions meet minimum ${minSafePieces} safe pieces, selected position with highest count ${maxSafePieces}: (${selectedPosition.col},${selectedPosition.row})`
    );
  }

  return selectedPosition;
}

export function makeAIPieceSelection(input: AIInput): PieceAttributes | null {
  const { availablePieces, board, enableLogging = false, difficulty = 'normal' } = input;

  debugLog(enableLogging, `🟡 Basic AI (${difficulty}): Selecting piece to give opponent...`);
  debugLog(enableLogging, `🟡 Basic AI: ${availablePieces.length} pieces available:`);
  if (enableLogging) {
    availablePieces.forEach((piece, index) => {
      debugLog(
        true,
        `  ${index}: ${formatPieceForLogging(piece)} (height:${piece.height}, color:${piece.color}, shape:${piece.shape}, top:${piece.top})`
      );
    });
  }

  if (availablePieces.length === 0) {
    debugLog(enableLogging, '🟡 Basic AI: No pieces available to give (game ending)');
    return null;
  }

  const randomChance = getRandomChance(difficulty);
  if (Math.random() < randomChance) {
    const randomPiece = getRandomElement(availablePieces);
    debugLog(enableLogging, `🎲 Basic AI (${difficulty}): Randomly selected ${formatPieceForLogging(randomPiece)}`);
    return randomPiece;
  }

  debugLog(enableLogging, '🟡 Basic AI: Checking for dangerous pieces...');

  const safePieces = availablePieces.filter(piece => {
    const isDangerous = canPieceLeadToWin(piece, board, enableLogging);
    debugLog(
      enableLogging && isDangerous,
      `⚠️ Basic AI: Piece ${formatPieceForLogging(piece)} is dangerous (allows opponent win)`
    );
    return !isDangerous;
  });

  if (safePieces.length > 0) {
    const selectedPiece = getRandomElement(safePieces);
    debugLog(
      enableLogging,
      `✅ Basic AI: Selected safe piece ${formatPieceForLogging(selectedPiece)} (${safePieces.length} safe pieces available)`
    );
    return selectedPiece;
  }

  const selectedPiece = getRandomElement(availablePieces);
  debugLog(
    enableLogging,
    `🚨 Basic AI: All pieces are dangerous! Selected ${formatPieceForLogging(selectedPiece)} randomly`
  );
  return selectedPiece;
}

export function makeAIMove(input: AIInput): AIMove {
  const { board, pieceToPlace, enableLogging = false } = input;

  debugLog(enableLogging, '\n🔷 Basic AI: Starting move evaluation...');

  const placement = makeAIPlacement(input);

  if (placement && pieceToPlace) {
    const testBoard = board.map(row => [...row]);
    testBoard[placement.row][placement.col] = pieceToPlace;

    if (checkWinCondition(testBoard)) {
      debugLog(enableLogging, '🏆 Basic AI: Winning placement found! Game ends, no piece to give.');
      return {
        placement,
        pieceToGive: null,
      };
    }

    debugLog(enableLogging, '🔄 Basic AI: Updating board state with placed piece for piece selection...');

    const updatedInput = {
      ...input,
      board: testBoard,
    };

    const pieceToGive = makeAIPieceSelection(updatedInput);

    debugLog(enableLogging, '🔷 Basic AI: Move evaluation complete');

    return {
      placement,
      pieceToGive,
    };
  }

  const pieceToGive = makeAIPieceSelection(input);

  debugLog(enableLogging, '🔷 Basic AI: Move evaluation complete');

  return {
    placement,
    pieceToGive,
  };
}
