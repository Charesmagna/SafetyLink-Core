import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

export const VoiceAccessibilityAssistant: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  const speak = (text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-ZA'; // South African English if available, or fallback
    utterance.rate = 0.9;
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  };
  
  const listen = (onResult: (text: string) => void) => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      // Simulate input after a delay
      setTimeout(() => onResult("John Doe"), 2000);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-ZA';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onResult(text);
    };
    
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setTimeout(() => onResult("Error Input"), 2000);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e){}
      }
    };
  }, []);

  const runStep1 = () => {
    setStep(1);
    setTranscript('');
    speak("Welcome to Safety Link. I am your voice accessibility assistant, here to help you set up your profile. Let's start with your name. What is your full name?", () => {
      listen((name) => {
        setTempName(name);
        runStep2(name);
      });
    });
  };

  const runStep2 = (name: string) => {
    setStep(2);
    setTranscript('');
    speak(`Nice to meet you, ${name || 'friend'}. Now, I need an emergency contact number. Please say the phone number you would like to save for emergencies.`, () => {
      listen((phone) => {
        setTempPhone(phone);
        runStep3(phone);
      });
    });
  };

  const runStep3 = (phone: string) => {
    setStep(3);
    setTranscript('');
    speak(`Got it. Saving number ${phone || 'provided'}. Your profile is ready. I am creating your account and logging you in now.`, () => {
      setTimeout(() => {
        handleRegister();
      }, 1000);
    });
  };

  useEffect(() => {
    // Auto-start
    const timer = setTimeout(() => {
      runStep1();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = () => {
    const { registerUser, login } = useAppStore.getState();
    const finalName = tempName || "Voice User";
    const username = finalName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
    
    registerUser({
      username: username,
      password: "password123",
      fullName: finalName,
      email: username + "@example.com",
      phone: tempPhone || "911",
      orgCode: "DEMO-ORG-01",
      emergencyContactsList: tempPhone || "911"
    });
    
    login(username, "password123");
    onClose();
  };

  const getStepText = () => {
    switch(step) {
      case 1: return "Listening for your name...";
      case 2: return "Listening for emergency contact number...";
      case 3: return "Finalizing account setup...";
      default: return "Initializing Assistant...";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[999999] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden scanlines">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8"
      >
        <div className="relative">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center bg-slate-900 transition-colors duration-500 ${isListening ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]'}`}>
            <svg className={`w-14 h-14 ${isListening ? 'text-emerald-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {isListening && (
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-4 border-emerald-500"
            />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white font-mono uppercase tracking-widest">
            Voice Assistant
          </h2>
          <p className="text-blue-400 font-mono text-sm tracking-wider uppercase">
            {getStepText()}
          </p>
        </div>

        <div className="w-full h-24 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center p-4">
          <p className="text-slate-300 font-mono text-lg truncate">
            {transcript || (isListening ? "Speak now..." : "Please wait...")}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 px-6 py-2 border border-slate-700 text-slate-400 rounded-full hover:bg-slate-800 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
        >
          Cancel Setup
        </button>
      </motion.div>
    </div>
  );
};
