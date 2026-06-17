import type { AIDifficulty } from '../../types/game';
import { AI_DIFFICULTY_OPTIONS } from '../../constants/aiDifficulty';
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
          {AI_DIFFICULTY_OPTIONS.map(({ value, label }) => (
            <label key={value} className={basicAIDifficulty === value ? 'selected' : ''}>
              <input
                type="radio"
                name="basicAIDifficulty"
                value={value}
                checked={basicAIDifficulty === value}
                onChange={(e) => setBasicAIDifficulty(e.target.value as AIDifficulty)}
              />
              <span>{label}</span>
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
