import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { Send, X } from 'lucide-react';
import klevaLogo from '../assets/images/kleva-logo.png';

export const KlevaBot: React.FC = () => {
  const { addAuditLog } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // South African local safety history / chat list
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; timestamp: number }>>([
    { 
      sender: 'bot', 
      text: "Awe! Sharp sharp! I am K'lev.ai, your proud South African safety co-responder. Powered by TM Media Solutions to keep your node secure in Jozi, Pretoria, Durban, or Venda! How can I assist you with loadshedding, emergency numbers, or iTAG button pairing today? 🇿🇦", 
      timestamp: Date.now() 
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // South African smart responder matching keys
  const getSouthAfricanResponse = (userMsg: string): string => {
    const text = userMsg.toLowerCase();
    
    // Loadshedding
    if (text.includes('loadshedding') || text.includes('load shedding') || text.includes('electricity') || text.includes('power') || text.includes('eskom')) {
      return "🕯️ SOUTH AFRICAN LOADSHEDDING INSIGHT:\n" +
             "During blackouts, safety risks double. Here are key K'lev.ai guidelines:\n" +
             "1. Ensure your physical SafetyLink iTAG is charged (button battery CR2032 holds up to 12 months).\n" +
             "2. Keep a fully-charged power bank connected to your gateway cellular device.\n" +
             "3. Map out local 'Safe Zones' in your area (e.g. well-lit filling stations or 24/7 retail plazas).\n" +
             "4. If lighting goes out, tap the Red Actuator on your SafetyLink dashboard to keep contacts notified. Stay safe, my friend!";
    }

    // Emergency Numbers in SA
    if (text.includes('emergency') || text.includes('number') || text.includes('police') || text.includes('saps') || text.includes('hotline') || text.includes('phone') || text.includes('call')) {
      return "📞 DIRECT CRITICAL HOTLINES (SOUTH AFRICA):\n" +
             "• SAPS Flying Squad / Crime Response: 10111\n" +
             "• Cellular Mobile Emergency (Works with no airtime): 112\n" +
             "• Netcare 911 (Ambulance & Trauma Escort): 082 911\n" +
             "• ER24 Emergency Response: 084 124\n" +
             "• Jozi Metro Police Dispatch: 011 375 5911\n" +
             "You can trigger an automated direct sequence call to these priorities on the 'Contacts' tab in SafetyLink!";
    }

    // Venda Language / Tshivenda Greeting
    if (text.includes('venda') || text.includes('tshivenda') || text.includes('ndi matsheloni') || text.includes('matsheloni') || text.includes('itages')) {
      return "🗣️ TSHIVENDA SAFETY DECRYPT:\n" +
             "Ndi matsheloni! Ni khou tshimbila zwavhudi? (Good morning! Are you traveling safely?)\n" +
             "Here are key security terms translated for your rescue node:\n" +
             "• Safety: Tsireledzo\n" +
             "• Emergency Distress: Khombo\n" +
             "• Help Me: Nthusedzeni\n" +
             "• Thank You: Ndi a livhuha\n" +
             "Remember, you can toggle the entire SafetyLink app to Tshivenda via the Settings menu at any time!";
    }

    // iTAG Pairing
    if (text.includes('pair') || text.includes('itag') || text.includes('bluetooth') || text.includes('connect') || text.includes('button')) {
      return "🏷️ PHYSICAL BUTTON PAIRING GUIDE:\n" +
             "To finalize and connect your physical distress clickers, follow these steps:\n" +
             "1. Go to the 'Beacons' tab.\n" +
             "2. Tap 'SCAN NATIVE iTAGS' to scan for nearby keyfobs.\n" +
             "3. Or select one of the 4 alternative binding interfaces (Manual MAC Registry, NFC Tap laser, Sonic/Audio Chirp, or local Volume Down mapper).\n" +
             "4. Test-fire the button: 1 press triggers contact pings, 3 clicks trigger instant SOS. Double-press to cancel an active alarm.";
    }

    // Local Slang & greetings
    if (text.includes('hello') || text.includes('hi') || text.includes('awe') || text.includes('yebo') || text.includes('lekker') || text.includes('sharp')) {
      return "Awe! Great to hear from you. K'lev.ai is active and monitoring coordinates around South Africa. Everything is lekker on our end. Let me know if you need to review local hotlines, learn Tshivenda emergency translations, or find out how to survive load-shedding safely!";
    }

    // Jozi / Gauteng safety
    if (text.includes('jozi') || text.includes('gauteng') || text.includes('jhb') || text.includes('joburg') || text.includes('sandton')) {
      return "🦁 JOZI/GAUTENG URBAN SAFETY:\n" +
             "Johannesburg South and metropolitan hubs require sharp awareness. Keep your SafetyLink volume set to high-vibration. If walking through CBD or Rosebank at night, ensure your 'Volume Down' mapper is armed so you can double-tap your pocketed phone to trigger a silent patrol dispatch without anyone knowing.";
    }

    // Default
    return "Sharp sharp! Your query has been analyzed. As your smart South African safety co-responder, I'm here to ensure Ubuntu in your community. Let me know if you need direct emergency numbers (10111/082911), Venda localization help, or load-shedding security checklists!";
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate South African smart intelligence response with a slight delay
    setTimeout(() => {
      const botResponse = getSouthAfricanResponse(userMsg);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse, timestamp: Date.now() }]);
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', "K'lev.ai chatbot answered inquiry", `Query: ${userMsg.substring(0, 30)}`);
    }, 1000);
  };

  const selectSuggestion = (suggestionText: string) => {
    setMessages(prev => [...prev, { sender: 'user', text: suggestionText, timestamp: Date.now() }]);
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = getSouthAfricanResponse(suggestionText);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse, timestamp: Date.now() }]);
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', "K'lev.ai suggestion triggered", suggestionText);
    }, 1000);
  };

  return (
    <div id="kleva-assistant-root" className="relative">
      {/* Floating Animated & Glowing Button */}
      <motion.button
        id="kleva-floating-bubble"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? { rotate: 90 } : { 
          y: [0, -6, 0],
          boxShadow: [
            "0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)",
            "0 15px 35px -5px rgba(16, 185, 129, 0.7), 0 0 25px rgba(16, 185, 129, 0.5)",
            "0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)"
          ]
        }}
        transition={isOpen ? { duration: 0.3 } : {
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer border-2 border-blue-500/60 bg-slate-950 p-1 overflow-hidden"
        title="Ask K'lev.ai South African Safety Assistant"
      >
        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-pulse pointer-events-none" />
        <div className="absolute inset-1 rounded-full border border-dashed border-emerald-500/30 animate-spin" style={{ animationDuration: '20s' }} />
        
        <img
          src={klevaLogo}
          alt="K'lev.ai Mascot"
          className="w-[44px] h-[44px] rounded-full object-cover shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse"
        />
      </motion.button>

      {/* Floating Chat Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="kleva-chat-panel"
            initial={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] h-[520px] bg-slate-950 border border-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden scanlines"
          >
            {/* Header branding lockup requested by user */}
            <div className="bg-slate-900/90 border-b border-slate-900 p-4 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-emerald-500" />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-[36px] h-[36px] rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <img
                      src={klevaLogo}
                      alt="K'lev.ai Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-widest font-mono text-slate-100 uppercase">
                      K'LEVA.I SAFETY HUB
                    </h3>
                    {/* Brand partnerships required by user */}
                    <div className="flex flex-col text-[8px] font-mono uppercase tracking-wider text-slate-500">
                      <span>SIMPLIFIED BY K'LEVA.I</span>
                      <span className="text-blue-400">POWERED BY TM MEDIA SOLUTIONS</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800/60 border border-slate-850 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat message flow */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col bg-slate-950/60">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed font-mono ${
                      m.sender === 'user'
                        ? 'bg-blue-600 border border-blue-500/20 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[7.5px] font-mono text-slate-600 mt-1 uppercase tracking-wider">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex mr-auto items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }}>
                    <img
                      src={klevaLogo}
                      alt="K'lev.ai Typing"
                      className="w-[24px] h-[24px] rounded-full object-cover"
                    />
                  </motion.div>
                  <div className="p-3 bg-slate-900 border border-slate-850 text-slate-500 text-xs rounded-2xl rounded-bl-none font-mono italic animate-pulse">
                    K'lev.ai is formulating SA safety parameters...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick-Click suggestion chips (Smart South African Contexts) */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-900/60 shrink-0">
              <span className="text-[7.5px] font-mono font-black text-slate-500 uppercase tracking-widest block mb-1.5 text-left">
                Suggested SA Safety Enquiries:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                {[
                  { text: 'Loadshedding Survival 🕯️', q: 'Tell me about Loadshedding survival and power backup' },
                  { text: 'SA Emergency Call list 📞', q: 'What are the main emergency numbers in South Africa?' },
                  { text: 'Pair iTAG Button 🏷️', q: 'How do I pair my physical Bluetooth button?' },
                  { text: 'Tshivenda translation 🗣️', q: 'Give me safety advice in Tshivenda' },
                  { text: 'Jozi Patrol safety 🦁', q: 'How do I stay safe in Jozi Gauteng?' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSuggestion(chip.q)}
                    className="px-2.5 py-1 text-[8.5px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 hover:border-slate-700 rounded-lg transition-all shrink-0 uppercase tracking-wider whitespace-nowrap cursor-pointer"
                  >
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Form input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-slate-900/80 border-t border-slate-900 shrink-0 flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask K'lev about SA emergency lines or button setup..."
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-950 border border-blue-500/20 rounded-xl text-white transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
