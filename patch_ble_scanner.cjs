const fs = require('fs');
let code = fs.readFileSync('src/components/BLEScanner.tsx', 'utf8');

// Add states
code = code.replace(
  "const [isDeviceScannerOpen, setIsDeviceScannerOpen] = React.useState<boolean>(false);",
  "const [isDeviceScannerOpen, setIsDeviceScannerOpen] = React.useState<boolean>(false);\n  const [showUpgradeGate, setShowUpgradeGate] = React.useState<boolean>(false);\n  const { currentUser } = useAppStore();"
);

// Add the handler
const handlerCode = `
  const handleBluetoothPairingRequest = (action: 'scan' | 'manual') => {
    // If not premium/active, show upgrade gate
    if (currentUser?.subscriptionStatus !== 'active' && currentUser?.subscriptionStatus !== 'trial') {
      setShowUpgradeGate(true);
    } else {
      if (action === 'scan') {
        startBleScan();
      } else {
        setShowManualPair(!showManualPair);
        setManualFormError('');
      }
    }
  };
`;

code = code.replace(
  "const handleInitNativePlugin",
  handlerCode + "\n  const handleInitNativePlugin"
);

// Replace button onClick for manual pair
code = code.replace(
  "onClick={() => {\n              setShowManualPair(!showManualPair);\n              setManualFormError('');\n            }}",
  "onClick={() => handleBluetoothPairingRequest('manual')}"
);

// Replace button onClick for startBleScan
code = code.replace(
  "onClick={startBleScan}",
  "onClick={() => handleBluetoothPairingRequest('scan')}"
);

// Add modal JSX
const modalJSX = `
      {/* Premium Upgrade Gate Modal */}
      <AnimatePresence>
        {showUpgradeGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-xl">
                  🔒
                </div>
                <button
                  onClick={() => setShowUpgradeGate(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Unlock Physical Panic Buttons</h3>
              
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                To trigger silent emergency alerts directly from your pocket without touching your phone, upgrade to <strong>SafetyLink Premium</strong> for just R49/month.
              </p>

              <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Bypass locked screens
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Connect up to 5 iTags
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Professional monitoring
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Start checkout flow - simulating for now
                    window.location.href = "https://paystack.com/pay/safetylink-premium";
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/50"
                >
                  Activate Button for R49/mo
                </button>
                <button
                  onClick={() => setShowUpgradeGate(false)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                >
                  Continue with Digital SOS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace(
  "{/* Pairing progress bar */}",
  modalJSX + "\n      {/* Pairing progress bar */}"
);

fs.writeFileSync('src/components/BLEScanner.tsx', code);
