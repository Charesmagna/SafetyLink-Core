import React, { useState, useEffect } from "react";
import { useAppStore } from "../utils/store";

// You would store these securely in your state manager (Redux/Zustand) or encrypted local storage.
const TRUE_PIN = "1234";
const DURESS_PIN = "9999"; 

interface OverlayProps {
  isActive: boolean;
  onTrueCancel: () => void;
  onDuressTrigger: () => void;
  onDispatchSOS: () => void;
}

export const SosCountdownOverlay: React.FC<OverlayProps> = ({ 
  isActive, 
  onTrueCancel, 
  onDuressTrigger, 
  onDispatchSOS 
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [pinInput, setPinInput] = useState("");
  const [isError, setIsError] = useState(false);

  // 1. The Critical Countdown Engine
  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      onDispatchSOS(); // Time is up. Fire the weapon.
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onDispatchSOS]);

  // Reset state when overlay opens
  useEffect(() => {
    if (isActive) {
      setTimeLeft(10);
      setPinInput("");
      setIsError(false);
    }
  }, [isActive]);

  // 2. The Keypad Logic
  const handleKeypress = (num: string) => {
    if (pinInput.length >= 4) return;
    
    const newPin = pinInput + num;
    setPinInput(newPin);
    setIsError(false);

    // Auto-evaluate when 4 digits are entered
    if (newPin.length === 4) {
      evaluatePin(newPin);
    }
  };

  const evaluatePin = (enteredPin: string) => {
    const { userPin, duressPin } = useAppStore.getState();
    if (enteredPin === userPin) {
      // User is safe. Cancel the alert.
      onTrueCancel();
    } else if (enteredPin === duressPin) {
      // User is under threat. Pretend to cancel, but silently escalate.
      onDuressTrigger();
    } else {
      // Wrong PIN. Vibrate, flash error, and clear input.
      setIsError(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => setPinInput(""), 500); // Clear after a short delay
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070a] text-white">
      
      {/* Visual Pulsing Warning */}
      <div className="absolute top-10 w-full text-center animate-pulse text-[#ff6b00] font-bold tracking-widest text-xl">
        EMERGENCY SOS TRIGGERED
      </div>

      {/* The Massive Tactical Countdown */}
      <div className="text-[12rem] font-black tracking-tighter leading-none text-[#ff4d4d] drop-shadow-[0_0_20px_rgba(255,77,77,0.5)]">
        {timeLeft}
      </div>
      <p className="text-[#5c7b85] font-semibold tracking-widest mt-2 uppercase">
        Seconds until global dispatch
      </p>

      {/* The PIN Pad */}
      <div className="mt-12 flex flex-col items-center w-full max-w-xs">
        
        {/* PIN Indicators */}
        <div className={`flex space-x-4 mb-8 ${isError ? 'animate-bounce text-red-500' : 'text-white'}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-6 h-6 rounded-full border-2 ${
                pinInput.length > index ? 'bg-white border-white' : 'border-[#5c7b85]'
              }`} 
            />
          ))}
        </div>

        {/* Numpad Grid */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeypress(num.toString())}
              className="h-16 rounded-lg bg-[#1a1f24] border border-[#2a3138] text-2xl font-bold active:bg-[#ff6b00] active:text-white transition-colors"
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty space for standard grid alignment */}
          <button
            onClick={() => handleKeypress("0")}
            className="h-16 rounded-lg bg-[#1a1f24] border border-[#2a3138] text-2xl font-bold active:bg-[#ff6b00] active:text-white transition-colors"
          >
            0
          </button>
          <button
            onClick={() => setPinInput(pinInput.slice(0, -1))}
            className="h-16 rounded-lg bg-[#1a1f24] border border-[#2a3138] text-xl font-bold text-[#5c7b85] active:bg-gray-700 transition-colors"
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  );
};
