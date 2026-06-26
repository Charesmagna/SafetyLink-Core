import React, { useState } from "react";
import { Users, Phone, Trash2, Plus, Sliders } from "lucide-react";

interface Contact {
  name: string;
  relationship: string;
  phone: string;
}

interface ContactsViewProps {
  contacts: Contact[];
  onAddContact: (name: string, relationship: string, phone: string) => void;
  onDeleteContact: (index: number) => void;
}

export default function ContactsView({
  contacts,
  onAddContact,
  onDeleteContact,
}: ContactsViewProps) {
  const [nameInput, setNameInput] = useState("");
  const [relInput, setRelInput] = useState("Spouse");
  const [phoneInput, setPhoneInput] = useState("+27");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || !phoneInput) {
      alert("Please fill in both Name and Phone fields.");
      return;
    }
    onAddContact(nameInput, relInput, phoneInput);
    setNameInput("");
    setRelInput("Spouse");
    setPhoneInput("+27");
  };

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Emergency Cascade</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono">VOICE CALL CHAIN & BROADCAST LISTS</p>
      </div>

      {/* Intro info box */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 text-slate-400 text-[10px] leading-relaxed font-semibold">
        🛡️ When a panic is triggered, our servers initiate an automatic sequential phone-call cascading relay. If the first contact does not pick up, the system auto-escalates to the second, then sends SMS map-links to the broader neighborhood watch circles.
      </div>

      {/* Form to add a new contact */}
      <form onSubmit={handleSubmit} className="bg-slate-950 p-4 rounded-3xl border border-slate-800/80 space-y-3 shadow-inner">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Add Cascade Contact</span>
        
        <div className="space-y-2">
          {/* Name */}
          <input
            type="text"
            placeholder="Full Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
          />

          <div className="grid grid-cols-2 gap-2">
            {/* Relationship */}
            <select
              value={relInput}
              onChange={(e) => setRelInput(e.target.value)}
              className="bg-slate-900 border border-slate-850 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-bold"
            >
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Neighbor">Neighbor</option>
              <option value="CPF Watch">CPF Watch</option>
              <option value="Security Dispatch">Security Dispatch</option>
            </select>

            {/* Phone */}
            <input
              type="text"
              placeholder="+27 Phone"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono font-semibold"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add To Cascade Sequence
        </button>
      </form>

      {/* List segment */}
      <div className="space-y-2.5">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
          Voice Call Sequence Chain ({contacts.length})
        </span>

        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
          {contacts.map((contact, idx) => {
            // Get ordinal attempt suffix
            const attemptText = idx === 0 ? "1st Attempt Cascade" : idx === 1 ? "2nd Attempt Cascade" : `${idx + 1}th Attempt Cascade`;
            return (
              <div
                key={idx}
                className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/80 flex items-center justify-between"
              >
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none">
                      {attemptText}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold">• {contact.relationship}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-200">{contact.name}</h4>
                  <p className="text-[9px] text-slate-400 font-mono font-semibold">{contact.phone}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-850 cursor-pointer transition"
                    title="Manual Dial Backup"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onDeleteContact(idx)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded border border-slate-850 cursor-pointer transition"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
