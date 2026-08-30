import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Loader2, LogOut, Database, Mail, FormInput, FileUp } from 'lucide-react';

const provider = new GoogleAuthProvider();

// Scopes required for Drive, Gmail, Forms, and Picker
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/forms.body');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export default function WorkspaceIntegrations() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  useEffect(() => {
    const unsub = initAuth(
      (u, t) => { setNeedsAuth(false); setUser(u); setToken(t); },
      () => { setNeedsAuth(true); setUser(null); setToken(null); }
    );
    
    // Load Google Picker API script
    const script = document.createElement('script');
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
       (window as any).gapi.load('picker', {'callback': () => { console.log('Picker loaded'); }});
    };
    document.body.appendChild(script);

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setNeedsAuth(true);
    setUser(null);
    setToken(null);
  };

  const loadDriveFiles = async () => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name,mimeType)', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingDrive(false);
  };

  const openPicker = () => {
    if (!token || !(window as any).google || !(window as any).google.picker) return;
    
    const view = new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.DOCS);
    
    const picker = new (window as any).google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(firebaseConfig.apiKey)
      .setCallback((data: any) => {
        if (data[(window as any).google.picker.Response.ACTION] === (window as any).google.picker.Action.PICKED) {
          const doc = data[(window as any).google.picker.Response.DOCUMENTS][0];
          alert(`Selected: ${doc[(window as any).google.picker.Document.NAME]}`);
        }
      })
      .build();
    picker.setVisible(true);
  };

  if (needsAuth) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-300 font-mono tracking-widest uppercase mb-4">Workspace Sync</h3>
        <p className="text-xs text-slate-500 mb-6">Connect your Google Workspace to sync evidence, dispatch logs, and command forms automatically.</p>
        <button onClick={handleLogin} disabled={isLoggingIn} className="w-full flex justify-center items-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 rounded-xl transition-all shadow-sm">
          {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          )}
          Connect Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden font-mono">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/40">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">{user?.email}</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE SYNC
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-slate-300 p-2 rounded-full hover:bg-slate-800 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Drive Panel */}
        <div className="col-span-2 sm:col-span-1 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <Database size={16} className="text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Drive Evidence</h4>
          </div>
          <button onClick={loadDriveFiles} className="w-full mb-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold uppercase transition-colors">
            {isLoadingDrive ? 'Fetching...' : 'List Recent Files'}
          </button>
          <div className="space-y-2">
            {driveFiles.map(f => (
              <div key={f.id} className="text-[10px] truncate text-slate-400 bg-slate-900 px-2 py-1.5 rounded border border-slate-800">{f.name}</div>
            ))}
          </div>
        </div>

        {/* Picker Panel */}
        <div className="col-span-2 sm:col-span-1 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <FileUp size={16} className="text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">File Picker</h4>
          </div>
          <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Select specific incident reports or camera logs securely using Google Picker.</p>
          <button onClick={openPicker} className="w-full text-[10px] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 py-2 rounded-lg font-bold uppercase transition-colors">
            Open File Picker
          </button>
        </div>

        {/* Gmail Panel */}
        <div className="col-span-2 sm:col-span-1 bg-slate-950/50 border border-slate-800 rounded-xl p-4 opacity-70">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <Mail size={16} className="text-red-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Dispatch Mail</h4>
          </div>
          <p className="text-[10px] text-slate-500">Gmail integration active. System will dispatch SOS emails via your account.</p>
        </div>

        {/* Forms Panel */}
        <div className="col-span-2 sm:col-span-1 bg-slate-950/50 border border-slate-800 rounded-xl p-4 opacity-70">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <FormInput size={16} className="text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Forms Sync</h4>
          </div>
          <p className="text-[10px] text-slate-500">Connected to Google Forms for emergency response questionnaires.</p>
        </div>
      </div>
    </div>
  );
}
