import React from 'react';
import { CinematicLogoSmash } from './CinematicLogoSmash';

interface CinematicClosingLogoProps {
  onComplete: () => void;
}

export const CinematicClosingLogo: React.FC<CinematicClosingLogoProps> = ({ onComplete }) => {
  return <CinematicLogoSmash onComplete={onComplete} />;
};
