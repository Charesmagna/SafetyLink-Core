import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const WorkspacePanel = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, \`[\${new Date().toLocaleTimeString()}] \${msg}\`]);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
      addLog('OAuth authentication successful.');
    },
    onError: (error) => {
      addLog('OAuth authentication failed: ' + error.error_description);
    },
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/contacts https://mail.google.com/ https://www.googleapis.com/auth/chat.messages https://www.googleapis.com/auth/chat.spaces',
  });

  const testSheets = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Sheets API...');
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title: 'SafetyLink Export' } })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(\`Created spreadsheet: \${data.spreadsheetUrl}\`);
      } else {
        addLog(\`Sheets error: \${data.error.message}\`);
      }
    } catch (e: any) {
      addLog('Sheets test failed: ' + e.message);
    }
  };

  const testContacts = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Contacts API...');
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses', {
        headers: { 'Authorization': \`Bearer \${accessToken}\` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(\`Fetched \${data.connections ? data.connections.length : 0} contacts.\`);
      } else {
        addLog(\`Contacts error: \${data.error.message}\`);
      }
    } catch (e: any) {
      addLog('Contacts test failed: ' + e.message);
    }
  };

  const testGmail = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Gmail API...');
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { 'Authorization': \`Bearer \${accessToken}\` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(\`Gmail profile fetched: \${data.emailAddress}\`);
      } else {
        addLog(\`Gmail error: \${data.error.message}\`);
      }
    } catch (e: any) {
      addLog('Gmail test failed: ' + e.message);
    }
  };

  const testChat = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Chat API...');
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { 'Authorization': \`Bearer \${accessToken}\` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(\`Chat spaces fetched: \${data.spaces ? data.spaces.length : 0} spaces.\`);
      } else {
        addLog(\`Chat error: \${data.error.message}\`);
      }
    } catch (e: any) {
      addLog('Chat test failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-blue-400 font-mono font-bold uppercase tracking-wider mb-2">🏢 Google Workspace Integration</h3>
        <p className="text-slate-400 text-xs mb-6 max-w-2xl leading-relaxed">
          Connect your Google Workspace account to SafetyLink. This allows exporting incident reports to Sheets, syncing responder Contacts, sending automated Gmail alerts, and broadcasting updates to Google Chat spaces.
        </p>
        
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => login()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase rounded shadow-lg transition-colors"
          >
            {accessToken ? 'Reconnect Account' : 'Connect Google Workspace'}
          </button>
        </div>

        {accessToken && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button onClick={testSheets} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-green-500 transition-colors text-center">
              <div className="text-green-500 text-2xl mb-2">📊</div>
              <div className="text-xs font-bold text-slate-300">Test Sheets</div>
            </button>
            <button onClick={testContacts} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-blue-400 transition-colors text-center">
              <div className="text-blue-400 text-2xl mb-2">👥</div>
              <div className="text-xs font-bold text-slate-300">Test Contacts</div>
            </button>
            <button onClick={testGmail} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-red-400 transition-colors text-center">
              <div className="text-red-400 text-2xl mb-2">✉️</div>
              <div className="text-xs font-bold text-slate-300">Test Gmail</div>
            </button>
            <button onClick={testChat} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-emerald-400 transition-colors text-center">
              <div className="text-emerald-400 text-2xl mb-2">💬</div>
              <div className="text-xs font-bold text-slate-300">Test Chat</div>
            </button>
          </div>
        )}

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 h-48 overflow-y-auto">
          <div className="text-slate-500 mb-2">// Integration Logs</div>
          {log.map((l, i) => (
            <div key={i} className="mb-1">{l}</div>
          ))}
          {log.length === 0 && <div>Ready to authenticate.</div>}
        </div>
      </div>
    </div>
  );
};

export const WorkspaceIntegrations = () => {
  // Use the default AI Studio Google Cloud project's web client ID or let the platform inject it if configured.
  // Assuming process.env.VITE_GOOGLE_CLIENT_ID exists, if not fallback to a placeholder.
  // Actually, AI Studio automatically sets up the OAuth client if we use the implicit flow or we might need the client ID.
  // The tool 'set_up_oauth' creates an OAuth client. Usually, we need the Client ID. 
  // Wait, I should read from import.meta.env.VITE_GOOGLE_CLIENT_ID. If it's missing, tell the user.
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-placeholder.apps.googleusercontent.com';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <WorkspacePanel />
    </GoogleOAuthProvider>
  );
};
