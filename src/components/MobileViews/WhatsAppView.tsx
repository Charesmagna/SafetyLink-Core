import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, ArrowLeft, Send, CheckCheck } from "lucide-react";

interface WaMessage {
  sender: "user" | "contact";
  text: string;
  time: string;
}

interface WhatsAppViewProps {
  contacts: Array<{ name: string; phone: string }>;
  waMessages: Record<string, WaMessage[]>;
  setWaMessages: React.Dispatch<React.SetStateAction<Record<string, WaMessage[]>>>;
}

export default function WhatsAppView({
  contacts,
  waMessages,
  setWaMessages,
}: WhatsAppViewProps) {
  const [activeChatPhone, setActiveChatPhone] = useState<string | null>(null);
  const [typedMsg, setTypedMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback default message if chat is empty
  const getChatMessages = (phone: string): WaMessage[] => {
    return waMessages[phone] || [
      { sender: "contact", text: "Hi, let me know if you need anything. I am keeping my SafetyLink system active.", time: "10:15 AM" }
    ];
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatPhone, waMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMsg.trim() || !activeChatPhone) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: WaMessage = { sender: "user", text: typedMsg, time: timeStr };

    // Append user message
    setWaMessages((prev) => {
      const current = prev[activeChatPhone] || [];
      return {
        ...prev,
        [activeChatPhone]: [...current, userMsg],
      };
    });

    const msgLower = typedMsg.toLowerCase();
    setTypedMsg("");

    // Simulate reactive replies
    setTimeout(() => {
      let replyText = "Received. I am monitoring the active GP Watch channels now.";
      if (msgLower.includes("sos") || msgLower.includes("help") || msgLower.includes("emergency")) {
        replyText = "Oh my god! I received the live SafetyLink broadcast notification. Dispatchers are informed, stay down!";
      } else if (msgLower.includes("ok") || msgLower.includes("fine") || msgLower.includes("safe")) {
        replyText = "Thank goodness! Glad the crisis was resolved successfully. Log the report inside the app.";
      }

      const contactMsg: WaMessage = { sender: "contact", text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

      setWaMessages((prev) => {
        const current = prev[activeChatPhone] || [];
        return {
          ...prev,
          [activeChatPhone]: [...current, contactMsg],
        };
      });
    }, 2000);
  };

  if (activeChatPhone) {
    const contact = contacts.find((c) => c.phone === activeChatPhone) || { name: "Primary Contact", phone: activeChatPhone };
    const chatMsgs = getChatMessages(activeChatPhone);

    return (
      <div className="flex-grow flex flex-col bg-[#0b141a] h-full text-xs text-slate-200">
        {/* Chat Header */}
        <div className="bg-[#1f2c34] px-3.5 py-2 flex items-center gap-2 border-b border-slate-950 shrink-0 text-left">
          <button
            onClick={() => setActiveChatPhone(null)}
            className="p-1 hover:bg-slate-800 rounded-full text-emerald-500 cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="w-8 h-8 bg-emerald-600/20 text-emerald-400 rounded-full flex items-center justify-center font-bold font-sans">
            {contact.name[0]}
          </div>
          <div>
            <h4 className="font-extrabold text-white text-xs">{contact.name}</h4>
            <p className="text-[8px] text-emerald-400 font-bold tracking-wider uppercase">Online • SafetyLink Peer</p>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto max-h-[460px] flex flex-col">
          {chatMsgs.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={idx}
                className={`max-w-[80%] rounded-xl px-3 py-2 text-xs text-left relative ${
                  isUser
                    ? "bg-[#005c4b] text-slate-100 self-end rounded-tr-none"
                    : "bg-[#202c33] text-slate-100 self-start rounded-tl-none"
                }`}
              >
                <p className="leading-relaxed font-sans">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 text-[8px] text-slate-400 font-semibold mt-1 font-mono">
                  <span>{msg.time}</span>
                  {isUser && <CheckCheck className="w-3 h-3 text-sky-400" />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="bg-[#1f2c34] p-2 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Type a secure message..."
            value={typedMsg}
            onChange={(e) => setTypedMsg(e.target.value)}
            className="flex-1 bg-[#2a3942] border-none text-white text-xs rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
          <button
            type="submit"
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col bg-[#111b21] h-full text-xs text-slate-200 text-left">
      {/* Header */}
      <div className="bg-[#1f2c34] p-4 border-b border-slate-950 flex items-center justify-between shrink-0">
        <h3 className="font-extrabold text-sm text-white">Meta WhatsApp Hub</h3>
        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
          SIMULATED PHONE OS
        </span>
      </div>

      {/* Intro info */}
      <div className="bg-[#1f2c34]/40 p-3 border-b border-slate-950 text-[10px] text-slate-400 leading-normal font-medium">
        💬 Monitor active WhatsApp logs sent to your emergency call loops. Outgoing distress SMS/WA updates with coordinates will populate here automatically.
      </div>

      {/* Contacts Chat Thread List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic font-mono font-semibold">
            No contacts configured. Set them up inside the Contacts tab.
          </div>
        ) : (
          contacts.map((contact) => {
            const chatMsgs = getChatMessages(contact.phone);
            const lastMsg = chatMsgs[chatMsgs.length - 1];

            return (
              <button
                key={contact.phone}
                onClick={() => setActiveChatPhone(contact.phone)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#202c33] transition cursor-pointer text-left"
              >
                <div className="w-10 h-10 bg-emerald-600/15 text-emerald-400 rounded-full flex items-center justify-center font-extrabold text-sm border border-emerald-500/10 shrink-0">
                  {contact.name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-extrabold text-xs text-white truncate">{contact.name}</h4>
                    <span className="text-[8px] text-slate-500 font-semibold font-mono">{lastMsg?.time || "10:15 AM"}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate font-sans">
                    {lastMsg?.text || "Hi, let me know if you need anything."}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
