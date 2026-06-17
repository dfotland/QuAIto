import React from 'react';
import type { GamePhase, PieceAttributes } from '../types/game';
import Piece from './Piece';
import './PieceSet.css';
import { generateAllPieces, getPieceId } from '../utils/gameUtils';

interface PieceSetProps {
  availablePieces: PieceAttributes[];
  onPieceSelect: (piece: PieceAttributes) => void;
  gamePhase?: GamePhase;
  gameOver?: boolean;
}

const PieceSet: React.FC<PieceSetProps> = ({
  availablePieces,
  onPieceSelect,
  gamePhase = 'give',
  gameOver = false,
}) => {
  const canSelectPieces = gamePhase === 'give' && !gameOver;

  const allPieces = generateAllPieces();
  const availablePieceIds = new Set(availablePieces.map(piece => getPieceId(piece)));

  return (
    <div className="piece-set">
      <div className={`pieces-grid ${!canSelectPieces ? 'disabled' : ''}`}>
        {allPieces.map((piece, index) => {
          const pieceId = getPieceId(piece);
          const isAvailable = availablePieceIds.has(pieceId);

          return (
            <div key={index} className="piece-slot">
              {isAvailable ? (
                <Piece
                  attributes={piece}
                  onClick={canSelectPieces ? () => onPieceSelect(piece) : undefined}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieceSet;
