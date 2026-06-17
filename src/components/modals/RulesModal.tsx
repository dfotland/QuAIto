import ModalShell from './ModalShell';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <ModalShell title="QuAIto (Quarto with AI)" onClose={onClose} modalClassName="rules-modal">
      <div className="rules-section">
        <h4>Objective</h4>
        <p>Be the first player to get four pieces in a row that share at least one common attribute.</p>
      </div>

      <div className="rules-section">
        <h4>Game Setup</h4>
        <ul>
          <li>There are 16 pieces, each with unique combination of the following attributes:</li>
          <li><strong>Height:</strong> Tall or Short</li>
          <li><strong>Color:</strong> Light or Dark</li>
          <li><strong>Shape:</strong> Ellipse or Rectangle</li>
          <li><strong>Split:</strong> Solid or Divided</li>
        </ul>
      </div>

      <div className="rules-section">
        <h4>How to Play</h4>
        <ol>
          <li><strong>The first move:</strong> Player 1 selects one piece and gives it to Player 2.</li>
          <li><strong>Remaining moves:</strong> The current player places his piece on any empty square. Then, selects a piece from the available pieces and gives it to their opponent.</li>
          <li>If a player creates a line of four pieces that share at least one common attribute, they win!</li>
          <li>The game continues until someone wins or the board is full (after 16 moves), which is a tie.</li>
        </ol>
      </div>

      <div className="rules-section">
        <h4>Winning</h4>
        <p>A player wins by creating a line of four pieces that share at least one common attribute. Winning lines can be:</p>
        <ul>
          <li>Horizontal (any row)</li>
          <li>Vertical (any column)</li>
          <li>Diagonal (either diagonal)</li>
        </ul>
      </div>

      <div className="rules-section">
        <h4>Strategy Tips</h4>
        <ul>
          <li>Avoid giving your opponent a piece that could complete a winning line.</li>
          <li>Place your piece to limit your opponent's choices. Force them to give you a piece that helps your strategy.</li>
          <li>Unless someone misses a winning move, the game is usually decided in the last few moves. Spend extra time thinking as the game nears the end.</li>
        </ul>
      </div>
    </ModalShell>
  );
}
