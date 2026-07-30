const fs = require('fs');
let content = fs.readFileSync('src/components/BLEScanner.tsx', 'utf8');

const targetStr = `      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />`;
const importTargetStr = `const { bleDevices, discoveredDevices, isScanning, pairingProgress, startBleScan, disconnectBleDevice, connectBleDevice, removeDevice, registerDiscoveredDevice, demoMode } = useAppStore();`;

const newImport = `const { bleDevices, discoveredDevices, isScanning, pairingProgress, startBleScan, disconnectBleDevice, connectBleDevice, removeDevice, registerDiscoveredDevice, demoMode, isBackgroundServiceRunning } = useAppStore();`;

const replacement = `      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />
      
      {/* BACKGROUND SERVICE INDICATOR */}
      <div className="relative z-10 w-full mb-3 flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🔄</span>
          <div className="text-left font-mono">
            <p className="text-[9px] font-bold text-slate-200">OS KEEPALIVE SERVICE</p>
            <p className="text-[7.5px] text-slate-500">BleReconnectWorker</p>
          </div>
        </div>
        <div className={\`px-2 py-0.5 border rounded flex items-center gap-1.5 \${isBackgroundServiceRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}\`}>
          <div className={\`w-1.5 h-1.5 rounded-full \${isBackgroundServiceRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}\`} />
          <span className="text-[7.5px] font-bold uppercase tracking-wider">{isBackgroundServiceRunning ? 'ACTIVE' : 'STOPPED'}</span>
        </div>
      </div>`;

if (content.includes(targetStr) && content.includes(importTargetStr)) {
  content = content.replace(targetStr, replacement);
  content = content.replace(importTargetStr, newImport);
  fs.writeFileSync('src/components/BLEScanner.tsx', content);
  console.log("BLEScanner.tsx patched successfully");
} else {
  console.log("Target not found in BLEScanner.tsx");
}
