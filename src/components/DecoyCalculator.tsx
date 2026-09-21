import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';

export const DecoyCalculator: React.FC = () => {
  const { decoyCode, decoyDistressCode, triggerPanic, addToast, logout } = useAppStore();
  const [currentVal, setCurrentVal] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);

  const handlePress = (btn: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }

    if (btn === 'C' || btn === 'CE') {
      setCurrentVal('0');
      setExpression('');
      return;
    }

    if (btn === '⌫') {
      if (currentVal.length > 1) {
        setCurrentVal(currentVal.slice(0, -1));
      } else {
        setCurrentVal('0');
      }
      return;
    }

    if (btn === '=') {
      const code = currentVal.trim();
      if (code === decoyCode) {
        useAppStore.setState({ decoyActive: false });
        addToast('Decoy disguise deactivated. Workspace verified.', 'success');
        return;
      }
      if (code === decoyDistressCode) {
        triggerPanic('Covert distress activated via Decoy Calculator.');
        addToast('Secure connection established (Covert Mode).', 'success');
        setCurrentVal('0');
        setExpression('');
        return;
      }

      try {
        const fullExpr = expression + currentVal;
        // Evaluate safe arithmetic
        const sanitized = fullExpr.replace(/×/g, '*').replace(/÷/g, '/');
        // Simple safe evaluation
        const result = new Function(`return ${sanitized}`)();
        setHistory((prev) => [...prev, `${fullExpr} = ${result}`].slice(-4));
        setCurrentVal(String(result));
        setExpression('');
      } catch {
        setCurrentVal('Error');
      }
      return;
    }

    if (['+', '-', '×', '÷'].includes(btn)) {
      setExpression(currentVal + ' ' + btn + ' ');
      setCurrentVal('0');
      return;
    }

    if (currentVal === '0' || currentVal === 'Error') {
      setCurrentVal(btn);
    } else {
      setCurrentVal(currentVal + btn);
    }
  };

  const keypad: string[][] = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.']
  ];

  return (
    <div id="decoy-calculator-screen" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 digital-grid opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-sm midnight-glass p-6 space-y-6 relative z-10 rounded-2xl border border-slate-900 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎛️</span>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">Operational Calculator</h2>
              <p className="text-[8px] font-mono text-slate-600">Standard Desk Disguise Utility</p>
            </div>
          </div>
          <button
            id="decoy-shutdown-btn"
            onClick={() => {
              logout();
              addToast('Calculator session terminated.', 'info');
            }}
            className="text-[9px] font-mono px-2 py-1 bg-slate-900/60 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 border border-slate-900"
          >
            Shutdown
          </button>
        </div>

        <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl p-4 text-right font-mono space-y-1 shadow-inner relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/5" />
          <div className="h-10 text-[10px] text-slate-600 overflow-y-auto pr-1 flex flex-col justify-end">
            {history.map((h, i) => (
              <div key={i} className="opacity-60">{h}</div>
            ))}
          </div>
          <div className="text-[10px] text-emerald-500/60 min-h-[14px]">{expression}</div>
          <div className="text-2xl font-black text-slate-100 truncate tracking-wide">{currentVal}</div>
        </div>

        <div className="grid grid-cols-4 gap-3 font-mono">
          {keypad.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              {row.map((btn) => {
                const isOp = ['÷', '×', '-', '+', '='].includes(btn);
                const isClear = ['C', '⌫'].includes(btn);
                const isEquals = btn === '=';
                const isZero = btn === '0';

                return (
                  <motion.button
                    key={btn}
                    id={`calc-btn-${btn}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePress(btn)}
                    className={`h-14 rounded-xl flex items-center justify-center font-bold transition-all text-xs border ${
                      isEquals
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 col-span-1'
                        : isZero
                        ? 'col-span-2 bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                        : isOp
                        ? 'bg-slate-900/60 border-slate-800 text-cyan-400 hover:bg-slate-800/60'
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
