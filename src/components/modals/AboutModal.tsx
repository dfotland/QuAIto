import ModalShell from './ModalShell';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <ModalShell title="About QuAIto 1.0" onClose={onClose} modalClassName="about-modal">
      <div className="about-section">
        <h4>About the Game</h4>
        <p>Quarto is a strategic board game invented by Blaise Müller in 1991. It's a game of logic and pattern recognition where players must think ahead to avoid giving their opponent a winning piece.</p>
      </div>

      <div className="about-section">
        <h4>About This App</h4>
        <p>QuAIto is a digital implementation of Quarto that features:</p>
        <ul>
          <li><strong>AI Opponent:</strong> Four levels of difficulty. The game will start on easy mode. The AI will go first and give you a piece to play.</li>
          <li><strong>AI controls</strong> Use the AI configuration to choose players(s) for the AI</li>
          <li><strong>The AI:</strong> Uses heuristic-based decision making with configurable difficulty levels that adjust strategic thinking and randomness with minimal lookahead</li>
          <li><strong>Human vs Human:</strong> Turn of the AI player  to play against a friend locally</li>
        </ul>
      </div>

      <div className="about-section">
        <h4>Technology</h4>
        <p>Built with modern web technologies:</p>
        <ul>
          <li>React 19 with TypeScript</li>
          <li>Vite for fast development</li>
          <li>CSS Grid for responsive layout</li>
        </ul>
      </div>

      <div className="about-section">
        <h4>Contact</h4>
        <p>For suggestions or bugs, email: <strong>fotland@smart-games.com</strong></p>
      </div>
    </ModalShell>
  );
}
