import { useState } from 'react';

// GooglePicker — stubbed: Firebase Google Auth not configured
// Will be re-enabled when Firebase project is set up
export default function GooglePicker({ onFilePicked }: { onFilePicked?: (file: any) => void }) {
  const [msg, setMsg] = useState('');
  return (
    <div className="p-4 bg-slate-800 rounded-lg text-slate-400 text-sm">
      <p>Google Drive integration coming soon.</p>
      {msg && <p className="text-red-400 mt-2">{msg}</p>}
    </div>
  );
}
