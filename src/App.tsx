import { useRef, useState } from 'react';
import { TOTAL_PIECES } from './constants/game';
import GameBoard from './components/GameBoard';
import Piece from './components/Piece';
import ControlPanel from './components/ControlPanel';
import PieceSet from './components/PieceSet';
import AboutModal from './components/modals/AboutModal';
import AIConfigModal from './components/modals/AIConfigModal';
import RulesModal from './components/modals/RulesModal';
import { useAIController } from './hooks/useAIController';
import { useHumanInteraction } from './hooks/useHumanInteraction';
import type { AIResetRef, EnableAILoggingRef, HumanInputGuardRef } from './hooks/quartoGameTypes';
import { useQuartoGame } from './hooks/useQuartoGame';
import './App.css';

function App() {
  const aiResetRef = useRef<(() => void) | null>(null) as AIResetRef;
  const enableAILoggingRef = useRef(false) as EnableAILoggingRef;
  const humanInputGuardRef = useRef<() => boolean>(() => false) as HumanInputGuardRef;
  const game = useQuartoGame(aiResetRef, enableAILoggingRef, humanInputGuardRef);
  const ai = useAIController(game, aiResetRef, enableAILoggingRef);

  const { canHumanInteract, canHumanInteractNow, guardCellClick, guardPieceSelect } = useHumanInteraction({
    gameState: game.gameState,
    currentPlayer: game.currentPlayer,
    player1AI: ai.player1AI,
    player2AI: ai.player2AI,
    isAIThinking: ai.isAIThinking,
    isAIThinkingRef: ai.isAIThinkingRef,
    aiTurnLockRef: ai.aiTurnLockRef,
  });

  humanInputGuardRef.current = canHumanInteractNow;

  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="app">
      <div className="game-grid">
        <header className="header">
          <h1 className="game-title">QuAIto Game</h1>
          <div className="header-buttons">
            <button onClick={() => setShowRules(true)} className="header-button">
              Rules
            </button>
            <button onClick={() => setShowAbout(true)} className="header-button">
              About
            </button>
          </div>
        </header>

        <div className="game-board-area">
          <GameBoard
            onCellClick={(row, col) => guardCellClick(game.handleCellClick, row, col)}
            board={game.board}
            winningLine={game.winningLine}
            gameOver={game.gameState !== 'playing'}
            interactionDisabled={!canHumanInteractNow()}
            lastMove={game.lastMove}
          />
        </div>

        <div className="available-pieces-area">
          <h3>Available Pieces ({game.availablePieces.length}/{TOTAL_PIECES})</h3>
          <PieceSet
            availablePieces={game.availablePieces}
            onPieceSelect={(piece) => guardPieceSelect(game.handlePieceSelect, piece)}
            canSelectPieces={game.gamePhase === 'give' && canHumanInteractNow()}
            gameOver={game.gameState !== 'playing'}
          />
        </div>

        <ControlPanel
          onNewGame={game.startNewGame}
          onOpenAIConfig={() => setShowAIConfig(true)}
        />

        <div className="game-message-area">
          <div className="current-player-info">
            {game.gameState === 'won' && (
              <p className="player-status winner-announcement">🎉 Player {game.winner} wins! 🎉</p>
            )}
            {game.gameState === 'tie' && (
              <p className="player-status tie-announcement">It's a tie! 🤝</p>
            )}
            {game.gameState === 'playing' && (
              ai.isAIThinking ? (
                <p className="player-status ai-thinking">Player {game.currentPlayer} (AI) is thinking…</p>
              ) : (
                <p className="player-status">{game.getGameStatusMessage()}</p>
              )
            )}
          </div>
          <div className={`staging-area ${!canHumanInteract ? 'disabled' : ''}`}>
            {game.stagedPiece ? (
              <div className="staged-piece">
                <Piece attributes={game.stagedPiece} />
              </div>
            ) : (
              <div className="staging-empty" />
            )}
          </div>
        </div>
      </div>

      {showAIConfig && (
        <AIConfigModal
          onClose={() => setShowAIConfig(false)}
          player1AI={ai.player1AI}
          setPlayer1AI={ai.setPlayer1AI}
          player2AI={ai.player2AI}
          setPlayer2AI={ai.setPlayer2AI}
          basicAIDifficulty={ai.basicAIDifficulty}
          setBasicAIDifficulty={ai.setBasicAIDifficulty}
          enableAILogging={ai.enableAILogging}
          setEnableAILogging={ai.setEnableAILogging}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
