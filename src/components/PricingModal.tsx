import React from 'react';
import { Pricing } from './landing/Pricing';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg border border-slate-700"
          aria-label="Close pricing modal"
        >
          ✕
        </button>
        <div className="mt-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
          <Pricing 
            onLogin={onClose} 
            onRegisterUser={onClose} 
            onRegisterOrg={onClose} 
          />
        </div>
      </div>
    </div>
  );
};
