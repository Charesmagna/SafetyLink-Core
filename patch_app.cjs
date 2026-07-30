const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /{!\/\* MIDDLE: SOS Button fills remaining space \*\/}/;

const replacement = `{/* OFFLINE QUEUE INDICATOR */}
              {localOfflineQueue && localOfflineQueue.length > 0 && (
                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between mb-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📡</span>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-amber-400">OFFLINE SYNC PENDING</p>
                      <p className="text-[8.5px] text-amber-500/70">{localOfflineQueue.length} panic events waiting for network.</p>
                    </div>
                  </div>
                  <button onClick={() => syncOfflineQueue()} className="text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors">
                    RETRY
                  </button>
                </div>
              )}

              {/* MIDDLE: SOS Button fills remaining space */}`;

if (content.includes('{/* MIDDLE: SOS Button fills remaining space */}')) {
  content = content.replace('{/* MIDDLE: SOS Button fills remaining space */}', replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log("App.tsx patched successfully");
} else {
  console.log("Target not found in App.tsx");
}
