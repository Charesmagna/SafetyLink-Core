const fs = require('fs');
const path = 'src/components/AdvancedSubsystems.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add TuyaIoTService import
content = content.replace(
  "import { useDataOverAudio } from '../hooks/useDataOverAudio';",
  "import { useDataOverAudio } from '../hooks/useDataOverAudio';\nimport { tuyaIoTService } from '../services/TuyaIoTService';"
);

// 2. Add trigger function
const target1 = `  const toggleHardwareDestruction = () => {`;
const repl1 = `  const triggerTuyaIoT = async () => {
    try {
      useAppStore.getState().addToast("Triggering Tuya Smart Lock...", "info");
      await tuyaIoTService.triggerDevice('dummy_lock_id', [{ code: 'doorcontact_state', value: true }]);
      useAppStore.getState().addToast("Tuya Lock Triggered (Mocked Response)", "success");
    } catch (e) {
      useAppStore.getState().addToast("Tuya IoT Trigger Failed", "error");
    }
  };

  const toggleHardwareDestruction = () => {`;
content = content.replace(target1, repl1);

// 3. Add Tuya button to the UI
const target2 = `{/* Destructive Testing Zone */}`;
const repl2 = `{/* Tuya IoT Integration */}
        <div className="p-4 bg-slate-900 border-x border-b border-slate-800 rounded-b-xl flex justify-between items-center">
          <div>
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              Tuya IoT Authentication
            </h4>
            <p className="text-[8px] text-slate-500">Secure HMAC-SHA256 authenticated trigger for smart locks.</p>
          </div>
          <button
            onClick={triggerTuyaIoT}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all shrink-0"
          >
            Trigger Lock
          </button>
        </div>

        {/* Destructive Testing Zone */}`;
content = content.replace(target2, repl2);

fs.writeFileSync(path, content);
console.log('Patched AdvancedSubsystems.tsx');
