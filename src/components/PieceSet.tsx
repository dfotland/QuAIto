import React from 'react';
import type { PieceAttributes } from '../types/game';
import Piece from './Piece';
import './PieceSet.css';
import { generateAllPieces, getPieceId } from '../utils/gameUtils';

interface PieceSetProps {
  availablePieces: PieceAttributes[];
  onPieceSelect: (piece: PieceAttributes) => void;
  canSelectPieces?: boolean;
  gameOver?: boolean;
}

const PieceSet: React.FC<PieceSetProps> = ({
  availablePieces,
  onPieceSelect,
  canSelectPieces = false,
  gameOver = false,
}) => {
  const piecesSelectable = canSelectPieces && !gameOver;

  const allPieces = generateAllPieces();
  const availablePieceIds = new Set(availablePieces.map(piece => getPieceId(piece)));

  return (
    <div className="piece-set">
      <div className={`pieces-grid ${!piecesSelectable ? 'disabled' : ''}`}>
        {allPieces.map((piece, index) => {
          const pieceId = getPieceId(piece);
          const isAvailable = availablePieceIds.has(pieceId);

          return (
            <div key={index} className="piece-slot">
              {isAvailable ? (
                <Piece
                  attributes={piece}
                  onClick={piecesSelectable ? () => onPieceSelect(piece) : undefined}
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
