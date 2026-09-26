import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'motion/react';

export const DecoyCalculator: React.FC = () => {
  const { 
    decoyCode, 
    decoyDistressCode, 
    triggerPanic, 
    addToast,
    logout
  } = useAppStore();

  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleKeyPress = (val: string) => {
    // Play subtle audio vibration simulation click
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }

    if (val === 'C' || val === 'CE') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (val === '⌫') {
      if (display.length > 1) {
        setDisplay(display.slice(0, -1));
      } else {
        setDisplay('0');
      }
      return;
    }

    if (val === '=') {
      // Check the special secret codes!
      const codeTyped = display.trim();

      if (codeTyped === decoyCode) {
        // Unlock real application!
        useAppStore.setState({ decoyActive: false });
        addToast('Decoy disguise deactivated. Workspace verified.', 'success');
        return;
      }

      if (codeTyped === decoyDistressCode) {
        // Trigger covert alert!
        triggerPanic('Covert distress activated via Decoy Calculator.');
        addToast('Secure connection established (Covert Mode).', 'success');
        setDisplay('0');
        setEquation('');
        return;
      }

      try {
        // Safe evaluation of basic math expressions
        const sanitized = equation + display;
        // eslint-disable-next-line no-eval
        const result = eval(sanitized.replace(/×/g, '*').replace(/÷/g, '/'));
        setHistory(prev => [...prev, `${sanitized} = ${result}`].slice(-4));
        setDisplay(String(result));
        setEquation('');
      } catch {
        setDisplay('Error');
      }
      return;
    }

    if (['+', '-', '×', '÷'].includes(val)) {
      setEquation(display + ' ' + val + ' ');
      setDisplay('0');
      return;
    }

    // Numbers & decimals
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const buttons = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.']
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden scanlines">
      {/* Absolute background effects */}
      <div className="absolute inset-0 digital-grid opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      {/* Main glassmorphic container */}
      <div className="w-full max-w-sm midnight-glass p-6 space-y-6 relative z-10">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎛️</span>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Calculator</h2>
              <p className="text-[8px] font-mono text-slate-600">Standard Desk Disguise Utility</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              addToast('Calculator session terminated.', 'info');
            }} 
            className="text-[9px] font-mono px-2 py-1 bg-slate-900/60 hover:bg-slate-850 rounded text-slate-500 hover:text-slate-300 border border-slate-900"
          >
            Shutdown
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl p-4 text-right font-mono space-y-1 shadow-inner relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/5" />
          
          {/* History / Tape */}
          <div className="h-10 text-[10px] text-slate-600 overflow-y-auto pr-1 flex flex-col justify-end">
            {history.map((h, i) => (
              <div key={i} className="opacity-60">{h}</div>
            ))}
          </div>

          <div className="text-[10px] text-emerald-500/60 min-h-[14px]">
            {equation}
          </div>
          <div className="text-2xl font-black text-slate-100 truncate tracking-wide">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 font-mono">
          {buttons.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              {row.map((btn) => {
                const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
                const isClear = ['C', '⌫'].includes(btn);
                const isEquals = btn === '=';
                const isZero = btn === '0';

                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeyPress(btn)}
                    key={btn}
                    className={`h-14 rounded-xl flex items-center justify-center font-bold transition-all text-xs border ${
                      isEquals
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 neon-glow-emerald col-span-1'
                        : isZero
                        ? 'col-span-2 bg-slate-900/40 border-slate-850 text-slate-300 hover:bg-slate-800/40'
                        : isOperator
                        ? 'bg-slate-900/60 border-slate-850 text-cyan-400 hover:bg-slate-800/60'
                        : isClear
                        ? 'bg-slate-950/80 border-red-500/10 text-red-400 hover:bg-red-500/10'
                        : 'bg-slate-900/30 border-slate-900/60 text-slate-300 hover:bg-slate-900/60 hover:border-slate-800'
                    }`}
                  >
                    {btn}
                  </motion.button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="text-[8px] font-mono text-slate-700 text-center uppercase tracking-widest pt-2">
          Secure active matrix · offline crypt block
        </div>
      </div>
    </div>
  );
};
