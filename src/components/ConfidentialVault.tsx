import React, { useState, useRef } from 'react';
import { derivePasswordVerifier } from '../utils/crypto';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { encryptFileData, decryptFileData } from '../utils/crypto';
import { GooglePicker } from './GooglePicker';

export const ConfidentialVault: React.FC = () => {
  const {
    activeSOSState,
    vaultPassword,
    vaultSecurityQuestion,
    vaultSecurityAnswer,
    vaultFiles,
    vaultApps,
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
    addVaultFile,
    removeVaultFile,
    addVaultApp,
    removeVaultApp,
    addToast,
    addAuditLog
  } = useAppStore();

  // Authentication & setup states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotAnswerInput, setForgotAnswerInput] = useState('');
  
  // Setup fields
  const [setupPassword, setSetupPassword] = useState('');
  const [setupQuestion, setSetupQuestion] = useState('What was your first tactical security node ID?');
  const [setupAnswer, setSetupAnswer] = useState('');

  // Add item forms
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('PDF');
  const [newFileSize, setNewFileSize] = useState('1.2 MB');
  const [newAppName, setNewAppName] = useState('');
  const [newAppPackage, setNewAppPackage] = useState('');

  // Cryptographic File States & Drag-and-Drop
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processAndEncryptFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processAndEncryptFile(file);
    if (e.target) {
      e.target.value = ''; // Reset input
    }
  };

  const processAndEncryptFile = async (file: File) => {
    setIsEncrypting(true);
    addToast(`Encrypting ${file.name} (Zero-Knowledge)...`, 'info');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const { ciphertext, iv, salt } = await encryptFileData(arrayBuffer, vaultPassword);
          
          addVaultFile({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.name.split('.').pop()?.toUpperCase() || 'BIN',
            ciphertext,
            iv,
            salt,
            isEncrypted: true
          });

          addToast(`File cryptographically sealed: ${file.name}`, 'success');
          addAuditLog('SECURITY', 'INFO', `File added to Zero-Knowledge Vault: ${file.name}`, 'AES-GCM 256-bit sealed.');
        } catch (err: any) {
          addToast(`Encryption failed: ${err.message}`, 'error');
        } finally {
          setIsEncrypting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      addToast(`Failed to read file: ${err.message}`, 'error');
      setIsEncrypting(false);
    }
  };

  const handleDecryptAndDownload = async (file: any) => {
    if (!file.ciphertext || !file.iv || !file.salt) {
      // Mock files originally populated on init do not have ciphertext, trigger warning & simulated download
      addToast(`Decrypting mock file: ${file.name}`, 'info');
      setTimeout(() => {
        const blob = new Blob([`Decrypted mock payload for ${file.name}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast(`Mock file decrypted & downloaded!`, 'success');
      }, 500);
      return;
    }

    addToast(`Decrypting cryptographic node: ${file.name}...`, 'info');

    try {
      const arrayBuffer = await decryptFileData(file.ciphertext, file.iv, file.salt, vaultPassword);
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast(`File verified & decrypted: ${file.name}`, 'success');
      addAuditLog('SECURITY', 'INFO', `Decrypted and downloaded file: ${file.name}`, 'Integrity check passed.');
    } catch (err: any) {
      addToast(`Decryption failed: Integrity check failed or incorrect key.`, 'error');
      addAuditLog('SECURITY', 'SEVERE', `Failed decryption attempt on file: ${file.name}`, err.message);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupPassword || !setupAnswer) {
      addToast('Please fill out all security credentials.', 'error');
      return;
    }
    await setVaultPassword(setupPassword, setupQuestion, setupAnswer);
    setIsUnlocked(true);
    addToast('Confidential Vault encrypted successfully.', 'success');
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputHash = await derivePasswordVerifier(passwordInput);
    if (inputHash === vaultPassword) {
      setIsUnlocked(true);
      setShowForgot(false);
      setPasswordInput('');
      addToast('Cryptographic vault block decrypted.', 'success');
      addAuditLog('SECURITY', 'INFO', 'Confidential Vault unlocked.', 'Successful password entry.');
    } else {
      addToast('Decryption failed: Incorrect password.', 'error');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotAnswerInput.trim().toLowerCase() === vaultSecurityAnswer.trim().toLowerCase()) {
      setIsUnlocked(true);
      setShowForgot(false);
      setForgotAnswerInput('');
      addToast('Security answer verified. Vault unlocked.', 'success');
      addAuditLog('SECURITY', 'WARN', 'Vault bypassed via security question.', 'Forgot password recovery flow completed.');
    } else {
      addToast('Verification failed: Incorrect security response.', 'error');
    }
  };

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;
    addVaultFile({
      name: newFileName.endsWith(`.${newFileType.toLowerCase()}`) ? newFileName : `${newFileName}.${newFileType.toLowerCase()}`,
      size: newFileSize,
      type: newFileType
    });
    setNewFileName('');
    addToast('File enqueued to secure directory block.', 'success');
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppPackage) return;
    addVaultApp({ name: newAppName, packageName: newAppPackage });
    setNewAppName('');
    setNewAppPackage('');
    addToast('Target application bound to hidden system matrix.', 'success');
  };

  // If a trigger alert is active, hide everything and show glassmorphic "Data-Sync Pending" matching loaders!
  const isSOSAvaliable = activeSOSState !== 'IDLE';

  if (isSOSAvaliable) {
    return (
      <div className="p-6 midnight-glass border border-red-500/20 text-center space-y-4 animate-fadeIn">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="relative">
            <div className="pulse-glow-circle border-t-red-500" />
            <span className="absolute inset-0 flex items-center justify-center text-red-500 font-mono text-xs font-bold animate-pulse">LOCK</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-black uppercase text-red-400 tracking-wider">Data-Sync Pending...</h3>
            <p className="text-[10px] font-mono text-slate-500 leading-relaxed uppercase">
              SOS distress signal broadcast active. Cryptographic partition instantly locked down to protect user-defined secure files and private applications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Password Setup Screen (First Use)
  if (!vaultPassword) {
    return (
      <div className="p-5 midnight-glass text-left space-y-5">
        <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <div>
            <h2 className="text-xs font-mono font-black uppercase tracking-wider text-slate-200">Initialize Private Vault</h2>
            <p className="text-[8px] font-mono text-slate-500">Configure Secure Cryptographic Segment</p>
          </div>
        </div>

        <form onSubmit={handleSetupSubmit} className="space-y-4 font-mono text-[10px]">
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold tracking-wider">Vault Password</label>
            <input
              type="password"
              placeholder="Enter secure master password..."
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-emerald-500/30 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold tracking-wider">Security Question</label>
            <select
              value={setupQuestion}
              onChange={(e) => setSetupQuestion(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-emerald-500/30 rounded-xl text-slate-300 outline-none transition-all cursor-pointer"
            >
              <option>What was your first tactical security node ID?</option>
              <option>What is your primary emergency dispatch region?</option>
              <option>What was the name of your first security responder unit?</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase font-bold tracking-wider">Security Answer</label>
            <input
              type="text"
              placeholder="Enter cryptographic fallback answer..."
              value={setupAnswer}
              onChange={(e) => setSetupAnswer(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-emerald-500/30 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Create Vault Partition
          </button>
        </form>
      </div>
    );
  }

  // Password Unlock Screen
  if (!isUnlocked) {
    return (
      <div className="p-5 midnight-glass text-left space-y-5 animate-fadeIn">
        <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <div>
              <h2 className="text-xs font-mono font-black uppercase tracking-wider text-slate-200">Decrypt Vault block</h2>
              <p className="text-[8px] font-mono text-slate-500">Secure operator verification required</p>
            </div>
          </div>
        </div>

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
                  placeholder="Enter vault password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-cyan-500/30 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
                />
              </div>

              <div className="flex justify-between items-center text-[8px]">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-cyan-400 hover:underline uppercase tracking-wider font-bold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Unlock Partition
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
                <span className="text-[8px] text-slate-500 font-bold uppercase block">Security Question</span>
                <p className="font-bold">{vaultSecurityQuestion}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase font-bold tracking-wider">Your Answer</label>
                <input
                  type="text"
                  placeholder="Enter fallback answer..."
                  value={forgotAnswerInput}
                  onChange={(e) => setForgotAnswerInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-900 focus:border-amber-500/30 rounded-xl text-slate-100 placeholder-slate-700 outline-none transition-all"
                />
              </div>

              <div className="flex justify-between items-center text-[8px]">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="text-slate-500 hover:text-slate-300 uppercase tracking-wider font-bold"
                >
                  Back to Password
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Verify Answer
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Unlocked Vault Dashboard
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Vault Configuration header */}
      <div className="p-5 midnight-glass text-left space-y-4">
        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔓</span>
            <div>
              <h2 className="text-xs font-mono font-black uppercase tracking-wider text-emerald-400">Vault Partition Active</h2>
              <p className="text-[8px] font-mono text-slate-500">Cryptographic block decrypted</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsUnlocked(false);
              addToast('Confidential Vault locked successfully.', 'info');
            }}
            className="text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
          >
            Lock Vault
          </button>
        </div>

        {/* Global Security Toggles */}
        <div className="space-y-3 font-mono text-[9px] uppercase tracking-wider">
          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
            <div>
              <p className="font-bold text-slate-200">Decoy Disguise Launcher</p>
              <p className="text-[7.5px] text-slate-500 font-normal">Launch app disguised as operational calculator</p>
            </div>
            <button
              onClick={() => setDecoyActive(!decoyActive)}
              className={`px-3 py-1 rounded-lg border font-black transition-all ${
                decoyActive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
            >
              {decoyActive ? 'ACTIVE' : 'DISABLED'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
            <div>
              <p className="font-bold text-slate-200">Tactical Silence Mode</p>
              <p className="text-[7.5px] text-slate-500 font-normal">Disable device audio sirens on SOS broadcast</p>
            </div>
            <button
              onClick={() => setSilenceAlerts(!silenceAlerts)}
              className={`px-3 py-1 rounded-lg border font-black transition-all ${
                silenceAlerts
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
            >
              {silenceAlerts ? 'SILENT' : 'SIREN'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
            <div>
              <p className="font-bold text-slate-200">Firestore Cloud Sync</p>
              <p className="text-[7.5px] text-slate-500 font-normal">Sync configuration securely with Firestore database</p>
            </div>
            <button
              onClick={() => setFirestoreSync(!firestoreSync)}
              className={`px-3 py-1 rounded-lg border font-black transition-all ${
                firestoreSync
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
            >
              {firestoreSync ? 'CLOUD ACTIVE' : 'LOCAL ONLY'}
            </button>
          </div>
        </div>

        {/* Custom Decoy Codes */}
        <div className="grid grid-cols-2 gap-3 font-mono text-[9px] uppercase tracking-wider pt-1">
          <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
            <span className="text-slate-500 font-bold block text-[7.5px]">Calculator Bypass code</span>
            <input
              type="text"
              maxLength={4}
              value={decoyCode}
              onChange={(e) => setDecoyCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-transparent border-none text-emerald-400 font-bold text-base outline-none p-0"
            />
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
            <span className="text-slate-500 font-bold block text-[7.5px]">Covert Distress code</span>
            <input
              type="text"
              maxLength={4}
              value={decoyDistressCode}
              onChange={(e) => setDecoyDistressCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-transparent border-none text-red-400 font-bold text-base outline-none p-0"
            />
          </div>
        </div>
      </div>

      {/* Hidden Apps Section */}
      <div className="p-5 midnight-glass text-left space-y-4">
        <div className="border-b border-slate-900 pb-2">
          <h3 className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">Hidden specified applications</h3>
          <p className="text-[8px] font-mono text-slate-500">Apps hidden immediately on panic broadcast</p>
        </div>

        <div className="space-y-2 font-mono text-[9px]">
          {vaultApps.map((app) => (
            <div key={app.id} className="p-2.5 bg-slate-950/80 border border-slate-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">{app.name}</span>
                <span className="text-[7px] text-slate-600 block">{app.packageName}</span>
              </div>
              <button
                onClick={() => {
                  removeVaultApp(app.id);
                  addToast('App removed from secure lockdown.', 'info');
                }}
                className="text-red-500 hover:text-red-400 font-bold text-[8px] uppercase tracking-wider"
              >
                Remove
              </button>
            </div>
          ))}

          {vaultApps.length === 0 && (
            <p className="text-[8.5px] text-slate-600 text-center uppercase tracking-wider py-2">No apps in secure block list</p>
          )}
        </div>

        {/* Add App Form */}
        <form onSubmit={handleAddApp} className="grid grid-cols-2 gap-2 pt-2">
          <select
            value={newAppPackage}
            onChange={(e) => {
              setNewAppPackage(e.target.value);
              const selectedOption = e.target.options[e.target.selectedIndex];
              if (selectedOption.text !== 'Custom App...') {
                setNewAppName(selectedOption.text);
              }
            }}
            className="col-span-2 p-2 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-200 outline-none"
          >
            <option value="">-- Select App to Hide --</option>
            <option value="org.thoughtcrime.securesms">Signal Private Messenger</option>
            <option value="com.whatsapp">WhatsApp</option>
            <option value="org.telegram.messenger">Telegram</option>
            <option value="com.twitter.android">X (Twitter)</option>
            <option value="com.facebook.katana">Facebook</option>
            <option value="com.google.android.apps.photos">Google Photos</option>
            <option value="com.google.android.gm">Gmail</option>
            <option value="com.instagram.android">Instagram</option>
            <option value="custom">Custom App...</option>
          </select>
          {newAppPackage === 'custom' && (
            <>
              <input
                type="text"
                placeholder="App Name (e.g. Signal)"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-200 outline-none placeholder-slate-700"
              />
              <input
                type="text"
                placeholder="Package (e.g. org.signal)"
                value={newAppPackage}
                onChange={(e) => setNewAppPackage(e.target.value)}
                className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-200 outline-none placeholder-slate-700"
              />
            </>
          )}
          <button
            type="submit"
            className="col-span-2 py-2 bg-slate-900/60 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[8px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all"
          >
            Add Hidden App Target
          </button>
        </form>
      </div>

      {/* Google Picker Integration */}
      <div className="p-5 midnight-glass text-left space-y-4">
        <div className="border-b border-slate-900 pb-2">
          <h3 className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">Remote Secure Storage Link</h3>
          <p className="text-[8px] font-mono text-slate-500">Link external protected nodes via OAuth</p>
        </div>
        <GooglePicker />
      </div>

      {/* Secure File System Directory */}
      <div className="p-5 midnight-glass text-left space-y-4">
        <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">Secure File block directory</h3>
            <p className="text-[8px] font-mono text-slate-500">Confidential nodes and logs locked under ZK vault</p>
          </div>
          <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold px-2 py-0.5 rounded uppercase">
            AES-GCM 256-Bit
          </span>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed p-5 rounded-xl cursor-pointer text-center transition-all ${
            dragActive
              ? "border-cyan-500 bg-cyan-500/5"
              : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="text-xl block mb-1">📥</span>
          <p className="text-[9px] font-mono text-slate-300 font-bold uppercase tracking-wider">
            Drag & drop files here, or <span className="text-cyan-400 underline">browse</span>
          </p>
          <p className="text-[7.5px] font-mono text-slate-500 uppercase mt-1">
            {isEncrypting ? "Encrypting node..." : "Files are immediately encrypted client-side using Zero-Knowledge keys"}
          </p>
        </div>

        <div className="space-y-2 font-mono text-[9px]">
          {vaultFiles.map((file) => (
            <div key={file.id} className="p-2.5 bg-slate-950/80 border border-slate-900 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                <span className="text-base flex-shrink-0">📄</span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200 truncate">{file.name}</span>
                    {file.ciphertext ? (
                      <span className="text-[6.5px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1 rounded uppercase font-black tracking-widest flex-shrink-0">
                        ZK-AES
                      </span>
                    ) : (
                      <span className="text-[6.5px] bg-slate-900 border border-slate-800 text-slate-500 px-1 rounded uppercase font-black tracking-widest flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-[7.5px] text-slate-500 block uppercase tracking-wider">{file.type} · {file.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => handleDecryptAndDownload(file)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold text-[8px] uppercase tracking-wider px-2 py-1 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-900/30 rounded-lg transition-all"
                >
                  Decrypt & Download
                </button>
                <button
                  onClick={() => {
                    removeVaultFile(file.id);
                    addToast('File deleted securely from vault.', 'info');
                  }}
                  className="text-red-500 hover:text-red-400 font-bold text-[8px] uppercase tracking-wider px-2 py-1 bg-red-950/10 hover:bg-red-950/30 border border-red-900/10 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {vaultFiles.length === 0 && (
            <p className="text-[8.5px] text-slate-600 text-center uppercase tracking-wider py-2">Secure directory block empty</p>
          )}
        </div>

        {/* Add File Form */}
        <form onSubmit={handleAddFile} className="space-y-2 pt-2 border-t border-slate-900/40">
          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider font-bold">Inject Plaintext Placeholder Block (Manual Setup):</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="File Title (e.g. mission_manifest)"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 p-2 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-200 outline-none placeholder-slate-700"
            />
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value)}
              className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-300 outline-none cursor-pointer"
            >
              <option>PDF</option>
              <option>JSON</option>
              <option>XLSX</option>
              <option>JPG</option>
              <option>TXT</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="File Size (e.g. 512 KB)"
              value={newFileSize}
              onChange={(e) => setNewFileSize(e.target.value)}
              className="flex-1 p-2 bg-slate-950 border border-slate-900 rounded-lg text-[9px] font-mono text-slate-200 outline-none placeholder-slate-700"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900/60 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[8px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all"
            >
              Inject File Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
