import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
const scopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/contacts',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/meetings.space.readonly'
];
scopes.forEach(scope => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

const WorkspacePanel = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [needsAuth, setNeedsAuth] = useState(true);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (cachedAccessToken) {
          setAccessToken(cachedAccessToken);
          setUser(u);
          setNeedsAuth(false);
          addLog('Authenticated via Firebase Auth.');
        } else if (!isSigningIn) {
          setNeedsAuth(true);
        }
      } else {
        cachedAccessToken = null;
        setNeedsAuth(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    isSigningIn = true;
    try {
      addLog('Initiating sign in...');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setAccessToken(cachedAccessToken);
        setUser(result.user);
        setNeedsAuth(false);
        addLog('OAuth authentication successful.');
      } else {
        addLog('Authentication failed: No access token');
      }
    } catch (err: any) {
      addLog('OAuth authentication failed: ' + err.message);
    } finally {
      isSigningIn = false;
    }
  };

  const testSheets = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Sheets API...');
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title: 'SafetyLink Export' } })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Created spreadsheet: ${data.spreadsheetUrl}`);
      } else {
        addLog(`Sheets error: ${data.error.message}`);
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
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Fetched ${data.connections ? data.connections.length : 0} contacts.`);
      } else {
        addLog(`Contacts error: ${data.error.message}`);
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
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Gmail profile fetched: ${data.emailAddress}`);
      } else {
        addLog(`Gmail error: ${data.error.message}`);
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
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Chat spaces fetched: ${data.spaces ? data.spaces.length : 0} spaces.`);
      } else {
        addLog(`Chat error: ${data.error.message}`);
      }
    } catch (e: any) {
      addLog('Chat test failed: ' + e.message);
    }
  };

  const testCalendar = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Calendar API...');
      const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Fetched ${data.items ? data.items.length : 0} calendars.`);
      } else {
        addLog(`Calendar error: ${data.error.message}`);
      }
    } catch (e: any) {
      addLog('Calendar test failed: ' + e.message);
    }
  };

  const testTasks = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Tasks API...');
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Fetched ${data.items ? data.items.length : 0} task lists.`);
      } else {
        addLog(`Tasks error: ${data.error.message}`);
      }
    } catch (e: any) {
      addLog('Tasks test failed: ' + e.message);
    }
  };

  const testForms = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Forms API (Creating form is restricted, so we use Drive to list forms)...');
      const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.form'", {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Fetched ${data.files ? data.files.length : 0} forms.`);
      } else {
        addLog(`Forms error: ${data.error.message}`);
      }
    } catch (e: any) {
      addLog('Forms test failed: ' + e.message);
    }
  };

  const testMeet = async () => {
    if (!accessToken) return addLog('Please authenticate first.');
    try {
      addLog('Testing Google Meet API...');
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Created Meet space: ${data.meetingUri}`);
      } else {
        addLog(`Meet error: ${data.error.message}`);
      }
    } catch (e: any) {
      addLog('Meet test failed: ' + e.message);
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
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase rounded shadow-lg transition-colors flex items-center gap-2"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 bg-white rounded-full p-0.5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            {user ? `Reconnect (${user.email})` : 'Sign in with Google'}
          </button>
        </div>

        {accessToken && !needsAuth && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
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

            <button onClick={testCalendar} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-purple-500 transition-colors text-center">
              <div className="text-purple-500 text-2xl mb-2">📅</div>
              <div className="text-xs font-bold text-slate-300">Test Calendar</div>
            </button>
            <button onClick={testTasks} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-yellow-400 transition-colors text-center">
              <div className="text-yellow-400 text-2xl mb-2">✅</div>
              <div className="text-xs font-bold text-slate-300">Test Tasks</div>
            </button>
            <button onClick={testForms} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-indigo-400 transition-colors text-center">
              <div className="text-indigo-400 text-2xl mb-2">📋</div>
              <div className="text-xs font-bold text-slate-300">Test Forms</div>
            </button>
            <button onClick={testMeet} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-teal-400 transition-colors text-center">
              <div className="text-teal-400 text-2xl mb-2">📹</div>
              <div className="text-xs font-bold text-slate-300">Test Meet</div>
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
  return <WorkspacePanel />;
};
