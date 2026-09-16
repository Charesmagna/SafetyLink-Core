import { useState } from 'react';

export default function GooglePicker(_props: { _onFilePicked?: (file: any) => void }) {
  const [msg] = useState('');
  return (
    <div className="p-4 bg-slate-800 rounded-lg text-slate-400 text-sm">
      <p>Google Drive integration coming soon.</p>
      {msg && <p className="text-red-400 mt-2">{msg}</p>}
    </div>
  );
}
