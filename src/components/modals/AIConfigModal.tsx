import type { AIDifficulty } from '../../types/game';
import ModalShell from './ModalShell';

interface AIConfigModalProps {
  onClose: () => void;
  player1AI: boolean;
  setPlayer1AI: (value: boolean) => void;
  player2AI: boolean;
  setPlayer2AI: (value: boolean) => void;
  basicAIDifficulty: AIDifficulty;
  setBasicAIDifficulty: (value: AIDifficulty) => void;
  enableAILogging: boolean;
  setEnableAILogging: (value: boolean) => void;
}

export default function AIConfigModal({
  onClose,
  player1AI,
  setPlayer1AI,
  player2AI,
  setPlayer2AI,
  basicAIDifficulty,
  setBasicAIDifficulty,
  enableAILogging,
  setEnableAILogging,
}: AIConfigModalProps) {
  return (
    <ModalShell title="AI Configuration" onClose={onClose} modalClassName="ai-config-modal">
      <div className="ai-players-modal">
        <label>AI Players:</label>
        <div className="ai-player-modal">
          <label>
            <input
              type="checkbox"
              checked={player1AI}
              onChange={(e) => setPlayer1AI(e.target.checked)}
            />
            Player 1
          </label>
        </div>
        <div className="ai-player-modal">
          <label>
            <input
              type="checkbox"
              checked={player2AI}
              onChange={(e) => setPlayer2AI(e.target.checked)}
            />
            Player 2
          </label>
        </div>
      </div>

      <div className="basic-ai-config">
        <label>AI Difficulty:</label>
        <div className="difficulty-selection">
          {(['easy', 'normal', 'hard', 'brutal'] as const).map((level) => (
            <label key={level} className={basicAIDifficulty === level ? 'selected' : ''}>
              <input
                type="radio"
                name="basicAIDifficulty"
                value={level}
                checked={basicAIDifficulty === level}
                onChange={(e) => setBasicAIDifficulty(e.target.value as AIDifficulty)}
              />
              <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="config-group">
        <label>
          <input
            type="checkbox"
            checked={enableAILogging}
            onChange={(e) => setEnableAILogging(e.target.checked)}
          />
          Enable AI Logging (check console)
        </label>
      </div>
    </ModalShell>
  );
}
