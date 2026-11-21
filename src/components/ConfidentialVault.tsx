import React, { useState, useEffect, useMemo } from 'react';
import { derivePasswordVerifier, encryptFileData, decryptFileData } from '../utils/crypto';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { biometricService } from '../services/BiometricService';

type CredentialCategory = 'ALL' | 'LOGINS' | 'BANKING' | 'EMERGENCY_PINS' | 'WIFI_DEVICES' | 'NOTES';

interface EncryptedCredential {
  id: string;
  label: string;
  username: string;
  url?: string;
  category: Exclude<CredentialCategory, 'ALL'>;
  ciphertext: string;
  iv: string;
  salt: string;
  createdAt: number;
  updatedAt?: number;
}

const CATEGORIES: { id: CredentialCategory; label: string; icon: string }[] = [
  { id: 'ALL', label: 'All', icon: '🔑' },
  { id: 'LOGINS', label: 'Logins', icon: '🌐' },
  { id: 'BANKING', label: 'Banking', icon: '🏦' },
  { id: 'EMERGENCY_PINS', label: 'Emergency PINs', icon: '🛡️' },
  { id: 'WIFI_DEVICES', label: 'Wi-Fi / CCTV', icon: '📡' },
  { id: 'NOTES', label: 'Notes', icon: '📝' },
];

function evaluatePasswordStrength(pwd: string): { score: number; label: string; color: string; bar: string } {
  if (!pwd) return { score: 0, label: 'Empty', color: 'text-slate-500', bar: 'bg-slate-700 w-0' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'text-red-400', bar: 'bg-red-500 w-1/4' };
  if (score === 2 || score === 3) return { score, label: 'Moderate', color: 'text-amber-400', bar: 'bg-amber-400 w-2/4' };
  if (score === 4) return { score, label: 'Strong', color: 'text-cyan-400', bar: 'bg-cyan-400 w-3/4' };
  return { score, label: 'Military Grade', color: 'text-emerald-400', bar: 'bg-emerald-400 w-full' };
}

function generateCryptoPassword(length: number, useUpper: boolean, useDigits: boolean, useSymbols: boolean): string {
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%^&*()-_=+[]{}';
  let charset = lower;
  const required: string[] = [lower];
  if (useUpper) { charset += upper; required.push(upper); }
  if (useDigits) { charset += digits; required.push(digits); }
  if (useSymbols) { charset += symbols; required.push(symbols); }

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    const pool = i < required.length ? required[i] : charset;
    chars.push(pool[randomValues[i] % pool.length]);
  }
  // Fisher-Yates shuffle using crypto randomness
  const shuffleValues = new Uint32Array(chars.length);
  crypto.getRandomValues(shuffleValues);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  return chars.join('');
}

export const ConfidentialVault: React.FC = () => {
  const {
    activeSOSState,
    vaultPassword,
    vaultSecurityQuestion,
    vaultSecurityAnswer,
    silenceAlerts,
    firestoreSync,
    decoyActive,
    decoyCode,
    decoyDistressCode,
    setDecoyActive,
    setDecoyCode,
    setDecoyDistressCode,
    setVaultPassword,
    setSilenceAlerts,
    setFirestoreSync,
    addToast,
    addAuditLog
  } = useAppStore();

  // Authentication & setup states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotAnswerInput, setForgotAnswerInput] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('FINGERPRINT');
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  // Setup fields
  const [setupPassword, setSetupPassword] = useState('');
  const [setupQuestion, setSetupQuestion] = useState('What was your first tactical security node ID?');
  const [setupAnswer, setSetupAnswer] = useState('');

  // Password Manager state
  const [credentials, setCredentials] = useState<EncryptedCredential[]>(() => {
    try {
      const raw = localStorage.getItem('sl_vault_passwords');
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((c: any) => ({
        ...c,
        category: c.category || 'LOGINS',
      }));
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory>('ALL');
  const [credSearch, setCredSearch] = useState('');
  const [revealedCreds, setRevealedCreds] = useState<Record<string, { password: string; notes: string }>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showStealthDrawer, setShowStealthDrawer] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Add / Edit form fields
  const [credLabel, setCredLabel] = useState('');
  const [credUsername, setCredUsername] = useState('');
  const [credUrl, setCredUrl] = useState('');
  const [credCategory, setCredCategory] = useState<Exclude<CredentialCategory, 'ALL'>>('LOGINS');
  const [credPassword, setCredPassword] = useState('');
  const [credNotes, setCredNotes] = useState('');
  const [showFormPwd, setShowFormPwd] = useState(false);

  // Generator controls
  const [genLength, setGenLength] = useState(18);
  const [genUpper, setGenUpper] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPreview, setGeneratedPreview] = useState(() => generateCryptoPassword(18, true, true, true));

  useEffect(() => {
    let active = true;
    biometricService.checkAvailability().then(res => {
      if (active) {
        setBiometricAvailable(res.isAvailable);
        setBiometryType(res.biometryType);
      }
    });
    if (biometricService.isScopeUnlocked('vault')) {
      setIsUnlocked(true);
    }
    return () => { active = false; };
  }, []);

  const persistCredentials = (next: EncryptedCredential[]) => {
    setCredentials(next);
    try {
      localStorage.setItem('sl_vault_passwords', JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCredLabel('');
    setCredUsername('');
    setCredUrl('');
    setCredCategory('LOGINS');
    setCredPassword('');
    setCredNotes('');
    setShowFormPwd(false);
  };

  const handleBiometricUnlock = async () => {
    setIsAuthenticatingBiometric(true);
    try {
      const verified = await biometricService.authenticate({
        title: 'Unlock Password Manager',
        subtitle: 'Biometric Security Gate',
        description: 'Verify your fingerprint or face to decrypt your AES-256-GCM credentials.',
        negativeButtonText: 'Use Master Password'
      });

      if (verified) {
        setIsUnlocked(true);
        biometricService.grantScopeUnlock('vault');
        addToast('Biometrics verified. Password Manager unlocked.', 'success');
        addAuditLog('SECURITY', 'INFO', 'Password Manager unlocked.', 'Biometric identity verified.');
      } else {
        addToast('Biometric authentication unconfirmed or canceled.', 'warn');
      }
    } catch (err: any) {
      addToast(`Biometric error: ${err.message}`, 'error');
    } finally {
      setIsAuthenticatingBiometric(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupPassword || !setupAnswer) {
      addToast('Please fill out Master Password and recovery answer.', 'error');
      return;
    }
    await setVaultPassword(setupPassword, setupQuestion, setupAnswer);
    setIsUnlocked(true);
    addToast('AES-256 Password Manager initialized.', 'success');
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputHash = await derivePasswordVerifier(passwordInput);
    if (inputHash === vaultPassword) {
      setIsUnlocked(true);
      setShowForgot(false);
      setPasswordInput('');
      addToast('Password Manager unlocked.', 'success');
      addAuditLog('SECURITY', 'INFO', 'Password Manager unlocked.', 'Master password verified.');
    } else {
      addToast('Incorrect master password.', 'error');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotAnswerInput.trim().toLowerCase() === vaultSecurityAnswer.trim().toLowerCase()) {
      setIsUnlocked(true);
      setShowForgot(false);
      setForgotAnswerInput('');
      addToast('Security answer verified. Password Manager unlocked.', 'success');
      addAuditLog('SECURITY', 'WARN', 'Password Manager recovered via security question.', 'Recovery flow completed.');
    } else {
      addToast('Verification failed: Incorrect security response.', 'error');
    }
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credLabel.trim() || !credPassword.trim()) {
      addToast('Title and password/secret are required.', 'warn');
      return;
    }
    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({ password: credPassword, notes: credNotes.trim() })
      );
      const { ciphertext, iv, salt } = await encryptFileData(payload.buffer, vaultPassword || 'sl-vault-session');
      const now = Date.now();

      if (editingId) {
        const updated = credentials.map(c =>
          c.id === editingId
            ? {
                ...c,
                label: credLabel.trim(),
                username: credUsername.trim(),
                url: credUrl.trim() || undefined,
                category: credCategory,
                ciphertext,
                iv,
                salt,
                updatedAt: now,
              }
            : c
        );
        persistCredentials(updated);
        setRevealedCreds(prev => {
          const copy = { ...prev };
          delete copy[editingId];
          return copy;
        });
        addToast(`Updated "${credLabel.trim()}" (AES-256-GCM).`, 'success');
      } else {
        const entry: EncryptedCredential = {
          id: 'cred-' + now + '-' + Math.random().toString(36).slice(2, 6),
          label: credLabel.trim(),
          username: credUsername.trim(),
          url: credUrl.trim() || undefined,
          category: credCategory,
          ciphertext,
          iv,
          salt,
          createdAt: now,
          updatedAt: now,
        };
        persistCredentials([entry, ...credentials]);
        addToast(`Saved "${entry.label}" with AES-256-GCM encryption.`, 'success');
        addAuditLog('SECURITY', 'INFO', `Password entry encrypted: ${entry.label}`, `Category: ${entry.category}`);
      }

      resetForm();
      setShowAddForm(false);
    } catch (err: any) {
      addToast(`Encryption failed: ${err?.message || 'Error'}`, 'error');
    }
  };

  const handleStartEdit = async (cred: EncryptedCredential) => {
    try {
      let secret = revealedCreds[cred.id];
      if (!secret) {
        const buf = await decryptFileData(cred.ciphertext, cred.iv, cred.salt, vaultPassword || 'sl-vault-session');
        secret = JSON.parse(new TextDecoder().decode(buf));
      }
      setEditingId(cred.id);
      setCredLabel(cred.label);
      setCredUsername(cred.username || '');
      setCredUrl(cred.url || '');
      setCredCategory(cred.category || 'LOGINS');
      setCredPassword(secret.password || '');
      setCredNotes(secret.notes || '');
      setShowAddForm(true);
    } catch {
      addToast('Unable to decrypt entry for editing.', 'error');
    }
  };

  const handleRevealCredential = async (cred: EncryptedCredential) => {
    if (revealedCreds[cred.id]) {
      setRevealedCreds(prev => {
        const copy = { ...prev };
        delete copy[cred.id];
        return copy;
      });
      return;
    }
    try {
      const buf = await decryptFileData(cred.ciphertext, cred.iv, cred.salt, vaultPassword || 'sl-vault-session');
      const parsed = JSON.parse(new TextDecoder().decode(buf));
      setRevealedCreds(prev => ({ ...prev, [cred.id]: parsed }));
    } catch {
      addToast('Unable to decrypt entry with active master key.', 'error');
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      addToast(`Copied ${label} to clipboard.`, 'success');
    } catch {
      addToast('Clipboard unavailable on this device.', 'warn');
    }
  };

  const handleCopyCredentialPassword = async (cred: EncryptedCredential) => {
    try {
      let secret = revealedCreds[cred.id]?.password;
      if (!secret) {
        const buf = await decryptFileData(cred.ciphertext, cred.iv, cred.salt, vaultPassword || 'sl-vault-session');
        const parsed = JSON.parse(new TextDecoder().decode(buf));
        secret = parsed.password;
      }
      await handleCopyText(secret || '', `password for ${cred.label}`);
    } catch {
      addToast('Failed to decrypt & copy password.', 'error');
    }
  };

  const filteredCredentials = useMemo(() => {
    const q = credSearch.trim().toLowerCase();
    return credentials.filter(c => {
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        c.label.toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q) ||
        (c.url || '').toLowerCase().includes(q)
      );
    });
  }, [credentials, selectedCategory, credSearch]);

  const formStrength = evaluatePasswordStrength(credPassword);
  const genStrength = evaluatePasswordStrength(generatedPreview);

  // SOS Lockdown Shield
  if (activeSOSState !== 'IDLE') {
    return (
      <div className="p-6 midnight-glass border border-red-500/20 text-center space-y-4 animate-fadeIn">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="relative">
            <div className="pulse-glow-circle border-t-red-500" />
            <span className="absolute inset-0 flex items-center justify-center text-red-500 font-mono text-xs font-bold animate-pulse">LOCK</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-black uppercase text-red-400 tracking-wider">Password Manager Sealed</h3>
            <p className="text-[10px] font-mono text-slate-500 leading-relaxed uppercase">
              Active SOS broadcast detected. Your encrypted passwords and PINs are automatically locked until the emergency is resolved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // First-time Master Password Setup
  if (!vaultPassword) {
    return (
      <div className="p-5 midnight-glass text-left space-y-5">
        <div className="border-b border-slate-900 pb-3 flex items-center gap-2.5">
          <span className="text-xl">🔐</span>
          <div>
            <h2 className="text-xs font-mono font-black uppercase tracking-wider text-slate-100">Initialize Password Manager</h2>
            <p className="text-[8.5px] font-mono text-slate-500">Zero-Knowledge AES-256-GCM On-Device Credential Encryption</p>
          </div>
        </div>

        <form onSubmit={handleSetupSubmit} className="space-y-4 font-mono text-[10px]">
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold tracking-wider">Master Password</label>
            <input
              type="password"
              placeholder="Create a strong master password..."
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-emerald-500/40 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold tracking-wider">Recovery Question</label>
            <select
              value={setupQuestion}
              onChange={(e) => setSetupQuestion(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-emerald-500/40 rounded-xl text-slate-300 outline-none transition-all cursor-pointer"
            >
              <option>What was your first tactical security node ID?</option>
              <option>What is your primary emergency dispatch region?</option>
              <option>What was the name of your first security responder unit?</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold tracking-wider">Recovery Answer</label>
            <input
              type="text"
              placeholder="Enter fallback recovery answer..."
              value={setupAnswer}
              onChange={(e) => setSetupAnswer(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-emerald-500/40 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Create Encrypted Password Manager
          </button>
        </form>
      </div>
    );
  }

  // Unlock Screen
  if (!isUnlocked) {
    return (
      <div className="p-5 midnight-glass text-left space-y-5 animate-fadeIn">
        <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔐</span>
            <div>
              <h2 className="text-xs font-mono font-black uppercase tracking-wider text-slate-100">Unlock Password Manager</h2>
              <p className="text-[8.5px] font-mono text-slate-500">AES-256-GCM Encrypted Credentials ({credentials.length} saved)</p>
            </div>
          </div>
        </div>

        {biometricAvailable && (
          <div className="space-y-3 pb-1">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isAuthenticatingBiometric}
              className="w-full py-3 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/50 hover:from-emerald-900/60 hover:to-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-mono text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98]"
            >
              <span className="text-lg">{biometryType === 'FACE_ID' ? '👤' : '👆'}</span>
              <span>
                {isAuthenticatingBiometric
                  ? 'Verifying Biometrics...'
                  : `Unlock with ${biometryType === 'FACE_ID' ? 'Face ID' : 'Fingerprint'}`}
              </span>
            </button>
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-slate-900" />
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-600">OR MASTER PASSWORD</span>
              <div className="h-[1px] flex-1 bg-slate-900" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.form
              key="unlock"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleUnlockSubmit}
              className="space-y-4 font-mono text-[10px]"
            >
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold tracking-wider">Master Password</label>
                <input
                  type="password"
                  placeholder="Enter master password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-cyan-500/40 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
                />
              </div>

              <div className="flex justify-between items-center text-[8px]">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-cyan-400 hover:underline uppercase tracking-wider font-bold"
                >
                  Forgot master password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Decrypt Password Manager
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleForgotSubmit}
              className="space-y-4 font-mono text-[10px]"
            >
              <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-1 text-slate-300">
                <span className="text-[8px] text-slate-500 font-bold uppercase block">Recovery Question</span>
                <p className="font-bold">{vaultSecurityQuestion}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold tracking-wider">Your Answer</label>
                <input
                  type="text"
                  placeholder="Enter recovery answer..."
                  value={forgotAnswerInput}
                  onChange={(e) => setForgotAnswerInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-amber-500/40 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-[8px] text-slate-500 hover:text-slate-300 uppercase tracking-wider font-bold"
              >
                ← Back to Master Password
              </button>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Verify Recovery Answer
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Unlocked Password Manager Workspace
  return (
    <div className="space-y-4 animate-fadeIn pb-6" data-testid="password-manager-workspace">
      {/* Header Bar */}
      <div className="p-4 midnight-glass text-left space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
              🔐
            </div>
            <div>
              <h2 className="text-xs font-mono font-black uppercase tracking-wider text-emerald-400">
                Password Manager
              </h2>
              <p className="text-[8px] font-mono text-slate-400">
                AES-256-GCM Zero-Knowledge · {credentials.length} {credentials.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGenerator(g => !g)}
              className={`px-2.5 py-1.5 rounded-lg border text-[8.5px] font-mono font-bold uppercase transition-all ${
                showGenerator
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ⚡ Generator
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUnlocked(false);
                setRevealedCreds({});
                biometricService.lockScope('vault');
                addToast('Password Manager locked.', 'info');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[8.5px] font-mono font-bold uppercase transition-all"
            >
              🔒 Lock
            </button>
          </div>
        </div>

        {/* Built-in Cryptographic Password Generator */}
        <AnimatePresence>
          {showGenerator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-slate-950/90 border border-cyan-500/25 rounded-2xl space-y-3 font-mono overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">
                  Cryptographic Password Generator
                </span>
                <span className={`text-[8.5px] font-bold uppercase ${genStrength.color}`}>
                  {genStrength.label}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <code className="text-xs text-emerald-300 font-bold break-all select-all">
                  {generatedPreview}
                </code>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGeneratedPreview(generateCryptoPassword(genLength, genUpper, genDigits, genSymbols))}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[8.5px] font-bold"
                    title="Regenerate"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generatedPreview, 'generated password')}
                    className="px-2 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 text-[8px] font-bold uppercase"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCredPassword(generatedPreview);
                      setShowFormPwd(true);
                      setShowAddForm(true);
                      addToast('Generated password loaded into new credential form.', 'info');
                    }}
                    className="px-2 py-1 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 text-[8px] font-bold uppercase"
                  >
                    Use
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-[9px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Length: <strong className="text-white">{genLength}</strong></span>
                  <input
                    type="range"
                    min={12}
                    max={32}
                    value={genLength}
                    onChange={(e) => {
                      const nextLen = Number(e.target.value);
                      setGenLength(nextLen);
                      setGeneratedPreview(generateCryptoPassword(nextLen, genUpper, genDigits, genSymbols));
                    }}
                    className="w-40 accent-cyan-400"
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-[8.5px] text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genUpper}
                      onChange={(e) => {
                        setGenUpper(e.target.checked);
                        setGeneratedPreview(generateCryptoPassword(genLength, e.target.checked, genDigits, genSymbols));
                      }}
                      className="accent-cyan-400"
                    />
                    A-Z
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genDigits}
                      onChange={(e) => {
                        setGenDigits(e.target.checked);
                        setGeneratedPreview(generateCryptoPassword(genLength, genUpper, e.target.checked, genSymbols));
                      }}
                      className="accent-cyan-400"
                    />
                    0-9
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => {
                        setGenSymbols(e.target.checked);
                        setGeneratedPreview(generateCryptoPassword(genLength, genUpper, genDigits, e.target.checked));
                      }}
                      className="accent-cyan-400"
                    />
                    !@#$ Symbols
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + Add Button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={credSearch}
            onChange={(e) => setCredSearch(e.target.value)}
            placeholder="Search sites, usernames, PINs, cameras..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl text-[10px] font-mono text-slate-100 placeholder-slate-600 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (showAddForm) {
                resetForm();
                setShowAddForm(false);
              } else {
                resetForm();
                setShowAddForm(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[9.5px] font-mono font-black uppercase tracking-wider shrink-0 transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add Login'}
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg border text-[8.5px] font-mono font-bold uppercase whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Credential Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSaveCredential}
            className="p-4 midnight-glass border border-emerald-500/30 text-left space-y-3 font-mono"
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {editingId ? 'Edit Encrypted Credential' : 'New Encrypted Credential'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  const strong = generateCryptoPassword(genLength, true, true, true);
                  setCredPassword(strong);
                  setShowFormPwd(true);
                }}
                className="text-[8.5px] font-bold text-cyan-400 hover:text-cyan-300 uppercase"
              >
                ⚡ Auto-Generate Strong
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Title (e.g. FNB Banking, Home CCTV)"
                value={credLabel}
                onChange={(e) => setCredLabel(e.target.value)}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-100 outline-none focus:border-emerald-500/50"
                required
              />
              <select
                value={credCategory}
                onChange={(e) => setCredCategory(e.target.value as any)}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-200 outline-none focus:border-emerald-500/50"
              >
                <option value="LOGINS">🌐 Web / App Login</option>
                <option value="BANKING">🏦 Banking &amp; Cards</option>
                <option value="EMERGENCY_PINS">🛡️ Emergency / Gate PINs</option>
                <option value="WIFI_DEVICES">📡 Wi-Fi &amp; CCTV Cameras</option>
                <option value="NOTES">📝 Encrypted Secure Note</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Username / Email / Account #"
                value={credUsername}
                onChange={(e) => setCredUsername(e.target.value)}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-100 outline-none focus:border-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Website URL or Device IP (optional)"
                value={credUrl}
                onChange={(e) => setCredUrl(e.target.value)}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-100 outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type={showFormPwd ? 'text' : 'password'}
                  placeholder="Password, PIN, or Secret Key"
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-100 outline-none focus:border-emerald-500/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowFormPwd(v => !v)}
                  className="px-3 rounded-xl bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-bold uppercase"
                >
                  {showFormPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${formStrength.bar}`} />
                </div>
                <span className={`text-[8px] font-bold uppercase ${formStrength.color}`}>
                  {formStrength.label}
                </span>
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Optional recovery codes, security questions, or notes (also AES-256 encrypted)..."
              value={credNotes}
              onChange={(e) => setCredNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-100 outline-none focus:border-emerald-500/50 resize-none"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              {editingId ? 'Save Encrypted Changes' : '+ Encrypt & Store Entry'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Saved Credentials List */}
      <div className="space-y-2.5 text-left font-mono">
        {filteredCredentials.map((cred) => {
          const revealed = revealedCreds[cred.id];
          const catMeta = CATEGORIES.find(c => c.id === cred.category) || CATEGORIES[1];
          return (
            <div
              key={cred.id}
              className="p-3.5 midnight-glass border border-slate-800/90 hover:border-emerald-500/30 rounded-2xl space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm shrink-0">
                    {catMeta.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-100 truncate">{cred.label}</span>
                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase font-bold">
                        {catMeta.label}
                      </span>
                    </div>
                    {cred.username && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9.5px] text-slate-400 truncate">{cred.username}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(cred.username, 'username')}
                          className="text-[8px] text-cyan-400 hover:text-cyan-300 font-bold uppercase shrink-0"
                        >
                          Copy User
                        </button>
                      </div>
                    )}
                    {cred.url && (
                      <span className="text-[8px] text-slate-500 block truncate">{cred.url}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => handleRevealCredential(cred)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-[8px] font-bold uppercase"
                  >
                    {revealed ? 'Hide' : 'View'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCredentialPassword(cred)}
                    className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-bold uppercase"
                  >
                    Copy Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cred)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 rounded-lg text-[8px] font-bold uppercase"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      persistCredentials(credentials.filter(c => c.id !== cred.id));
                      addToast(`Deleted "${cred.label}".`, 'info');
                    }}
                    className="px-1.5 py-1 text-red-400 hover:text-red-300 font-bold text-[8px] uppercase"
                  >
                    Del
                  </button>
                </div>
              </div>

              {revealed && (
                <div className="p-2.5 bg-slate-950/90 border border-emerald-500/25 rounded-xl text-[9.5px] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-emerald-300 font-bold break-all select-all">
                      {revealed.password}
                    </span>
                    <span className={`text-[7.5px] font-bold uppercase shrink-0 ${evaluatePasswordStrength(revealed.password).color}`}>
                      {evaluatePasswordStrength(revealed.password).label}
                    </span>
                  </div>
                  {revealed.notes && (
                    <div className="text-[8.5px] text-slate-400 border-t border-slate-800/80 pt-1 break-words whitespace-pre-wrap">
                      {revealed.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCredentials.length === 0 && (
          <div className="p-8 midnight-glass text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <span className="text-2xl block">🔑</span>
            <p className="text-xs font-bold text-slate-300 uppercase">
              {credentials.length === 0 ? 'Your Password Manager is Empty' : 'No Matching Credentials'}
            </p>
            <p className="text-[9px] text-slate-500 max-w-xs mx-auto">
              Store logins, banking PINs, emergency gate codes, and CCTV passwords safely with zero-knowledge AES-256-GCM encryption.
            </p>
          </div>
        )}
      </div>

      {/* Collapsible Stealth & Decoy Security Drawer (preserves Calculator Disguise without clutter) */}
      <div className="midnight-glass rounded-2xl overflow-hidden text-left font-mono">
        <button
          type="button"
          onClick={() => setShowStealthDrawer(s => !s)}
          className="w-full p-3.5 flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-900/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🧮</span>
            <span>Stealth &amp; Decoy Calculator Protection</span>
          </span>
          <span className="text-slate-500">{showStealthDrawer ? '▲ Hide' : '▼ Configure'}</span>
        </button>

        {showStealthDrawer && (
          <div className="p-4 pt-1 border-t border-slate-900 space-y-3 text-[9px] uppercase tracking-wider">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-900 rounded-xl">
              <div>
                <p className="font-bold text-slate-200">Decoy Calculator Disguise</p>
                <p className="text-[7.5px] text-slate-500 font-normal normal-case">Mask SafetyLink behind a working calculator</p>
              </div>
              <button
                type="button"
                onClick={() => setDecoyActive(!decoyActive)}
                className={`px-3 py-1 rounded-lg border font-black ${
                  decoyActive
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {decoyActive ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-950/70 border border-slate-900 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold block text-[7.5px]">Unlock Code (=)</span>
                <input
                  type="text"
                  maxLength={4}
                  value={decoyCode}
                  onChange={(e) => setDecoyCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-transparent text-emerald-400 font-bold text-sm outline-none"
                />
              </div>
              <div className="p-2.5 bg-slate-950/70 border border-slate-900 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold block text-[7.5px]">Silent SOS Code (=)</span>
                <input
                  type="text"
                  maxLength={4}
                  value={decoyDistressCode}
                  onChange={(e) => setDecoyDistressCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-transparent text-red-400 font-bold text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSilenceAlerts(!silenceAlerts)}
                className={`p-2.5 rounded-xl border text-left ${
                  silenceAlerts
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-950/70 border-slate-900 text-slate-400'
                }`}
              >
                <span className="block font-bold">SOS Siren: {silenceAlerts ? 'SILENT' : 'AUDIBLE'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFirestoreSync(!firestoreSync)}
                className={`p-2.5 rounded-xl border text-left ${
                  firestoreSync
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    : 'bg-slate-950/70 border-slate-900 text-slate-400'
                }`}
              >
                <span className="block font-bold">Cloud Sync: {firestoreSync ? 'ON' : 'LOCAL'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
