import React, { useEffect, useState } from 'react';
import { useAppStore } from '../utils/store';

export const OrgWarRoom = () => {
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    // SSE setup (NTFY)
    const eventSource = new EventSource('https://ntfy.sh/safetylink_warroom/sse');
    eventSource.onmessage = (e) => {
      setMessages(prev => [...prev, e.data]);
    };
    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-[#020617] min-h-screen text-slate-200 p-8">
      <h1 className="text-4xl font-bold mb-8">ORG WAR ROOM</h1>
      <div className="flex gap-4 mb-8">
        <button className="text-2xl px-6 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 font-bold">NAVIGATE</button>
        <button className="text-2xl px-6 py-4 bg-green-600 rounded-xl hover:bg-green-700 font-bold">CALL VICTIM</button>
        <button className="text-2xl px-6 py-4 bg-red-600 rounded-xl hover:bg-red-700 font-bold">CLEAR SCENE</button>
      </div>
      
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 h-96 overflow-auto">
        <h2 className="text-xl font-bold mb-4">LIVE SSE STREAM</h2>
        {messages.map((m, i) => (
          <div key={i} className="text-sm font-mono text-emerald-400 border-b border-slate-800 py-2">{m}</div>
        ))}
      </div>
    </div>
  );
};
export default OrgWarRoom;
