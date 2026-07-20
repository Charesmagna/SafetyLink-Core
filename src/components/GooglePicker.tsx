import { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare var gapi: any;
declare var google: any;

// Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

export function GooglePicker() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Unfortunately Firebase Auth doesn't re-issue the OAuth token on auth state change.
        // We only get it immediately after signInWithPopup.
        // We require the user to sign in if we don't have the token in memory.
        if (!token) {
          setNeedsAuth(true);
        } else {
          setUser(user);
          setNeedsAuth(false);
        }
      } else {
        setNeedsAuth(true);
      }
    });
    return () => unsubscribe();
  }, [token]);

  useEffect(() => {
    // Load the Google API scripts
    const loadScript = (src: string, id: string) => {
      if (document.getElementById(id)) return;
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadScript('https://apis.google.com/js/api.js', 'gapi-script');
    loadScript('https://accounts.google.com/gsi/client', 'gis-client-script');
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const openPicker = () => {
    if (!token) return;
    
    // We assume gapi is loaded
    if (typeof gapi !== 'undefined' && gapi.load) {
      gapi.load('picker', { callback: createPicker });
    } else {
      console.error('gapi not loaded');
    }
  };

  const createPicker = () => {
    if (!token) return;
    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setDeveloperKey(firebaseConfig.apiKey) // Note: API Key might need to be created in GCP or we rely on OAuth token
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  };

  const pickerCallback = (data: any) => {
    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
      const doc = data[google.picker.Response.DOCUMENTS][0];
      setSelectedFile(doc);
    }
  };

  if (needsAuth) {
    return (
      <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-300 text-sm">Connect Google Drive to select files for the Confidential Vault.</p>
        <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button w-fit">
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper flex items-center justify-center bg-white text-slate-800 px-4 py-2 rounded-md font-medium text-sm gap-2">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Sign in with Google
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 border border-slate-700 bg-slate-800/40 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-200">Google Drive Linked</h3>
          <p className="text-xs text-slate-400">Authenticated as {user?.email}</p>
        </div>
        <button 
          onClick={openPicker}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          Open Google Picker
        </button>
      </div>

      {selectedFile && (
        <div className="p-4 border border-emerald-900/50 bg-emerald-950/20 rounded-lg">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Selected File</h4>
          <div className="flex items-center gap-3">
            {selectedFile.iconUrl && <img src={selectedFile.iconUrl} alt="icon" className="w-5 h-5" />}
            <div>
              <p className="text-sm text-slate-200 font-medium">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{selectedFile.mimeType}</p>
            </div>
            <a 
              href={selectedFile.url} 
              target="_blank" 
              rel="noreferrer"
              className="ml-auto text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              Open Link
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
