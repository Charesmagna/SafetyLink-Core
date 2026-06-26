import React, { useState, useRef } from "react";
import { User, MedicalProfile } from "../../types";
import { 
  Heart, User as UserIcon, Sliders, Check, Camera, Upload, 
  Accessibility, Eye, Volume2, ShieldAlert, Sparkles, HelpCircle 
} from "lucide-react";

interface ProfileViewProps {
  currentUser: User;
  currentMedical: MedicalProfile | null;
  onSaveProfile: (data: { 
    id: string; 
    name: string; 
    phone: string; 
    bio: string; 
    profilePhoto?: string;
    disabilityType?: string;
    disabilityAids?: string[];
    accessibilityHighContrast?: boolean;
  }) => void;
  onSaveMedical: (data: { bloodType: string; allergies: string; medications: string; notes: string }) => void;
}

// Preset South African emergency profile avatars
const PRESET_AVATARS = [
  { id: "av-1", label: "Responder Blue", url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80&q=80" },
  { id: "av-2", label: "Paramedic Rescue", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" },
  { id: "av-3", label: "Gauteng Volunteer", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80" },
  { id: "av-4", label: "Citizen Guardian", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" }
];

export default function ProfileView({
  currentUser,
  currentMedical,
  onSaveProfile,
  onSaveMedical,
}: ProfileViewProps) {
  // General Profile States
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileBio, setProfileBio] = useState(currentUser.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profilePhoto || "");

  // Medical Profile States
  const [bloodType, setBloodType] = useState(currentMedical?.bloodType || "O+");
  const [allergies, setAllergies] = useState(currentMedical?.allergies || "");
  const [medications, setMedications] = useState(currentMedical?.medications || "");
  const [medNotes, setMedNotes] = useState(currentMedical?.notes || "");

  // Disability Screening States
  const [disabilityType, setDisabilityType] = useState<string>(currentUser.disabilityType || "none");
  const [disabilityAids, setDisabilityAids] = useState<string[]>(currentUser.disabilityAids || []);
  const [highContrast, setHighContrast] = useState<boolean>(currentUser.accessibilityHighContrast || false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({ 
      id: currentUser.id, 
      name: profileName, 
      phone: profilePhone, 
      bio: profileBio,
      profilePhoto,
      disabilityType,
      disabilityAids,
      accessibilityHighContrast: highContrast
    });
  };

  const handleMedicalSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMedical({ bloodType, allergies, medications, notes: medNotes });
  };

  // Custom base64 photo uploader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Toggle specific disability aid
  const toggleAid = (aid: string) => {
    if (disabilityAids.includes(aid)) {
      setDisabilityAids(prev => prev.filter(a => a !== aid));
    } else {
      setDisabilityAids(prev => [...prev, aid]);
    }
  };

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left overflow-y-auto pb-16">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Identity Center</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono font-bold">BIODATA, PHOTO-ID & DISABILITY SCREENING</p>
      </div>

      {/* Profile Photo Upload Zone */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            {profilePhoto ? (
              <img 
                src={profilePhoto} 
                alt="User Profile" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <UserIcon className="w-7 h-7" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg cursor-pointer"
              title="Upload Custom Image"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="flex-1 space-y-1">
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">SECURE TELEMETRY PHOTO-ID</span>
            <h4 className="text-xs font-bold text-slate-200">Biometric Identity Picture</h4>
            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
              Upload emergency photo-ID for immediate paramedic/patrol verification during alarm dispatch.
            </p>
          </div>
        </div>

        {/* Preset quick selection */}
        <div className="pt-2 border-t border-slate-900">
          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Or Choose Tactical Presets:</span>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_AVATARS.map(avatar => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setProfilePhoto(avatar.url)}
                className={`p-1 rounded-xl bg-slate-900 border transition cursor-pointer text-center ${
                  profilePhoto === avatar.url ? "border-emerald-500/60 bg-emerald-950/20" : "border-slate-850 hover:border-slate-750"
                }`}
              >
                <img 
                  src={avatar.url} 
                  alt={avatar.label} 
                  className="w-7 h-7 rounded-lg object-cover mx-auto" 
                  referrerPolicy="no-referrer"
                />
                <span className="text-[6.5px] text-slate-400 font-semibold block mt-1 truncate">{avatar.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DISABILITY SCREENING & ASSISTIVE PANELS (Bonus Feature) */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-indigo-500/30 space-y-3 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl border-l border-b border-indigo-500/20">
          ASSISTIVE ONBOARDING
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Accessibility className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">Disability Screening & Aids</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase font-mono">Tailors client app to accommodate accessibility needs</p>
          </div>
        </div>

        <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">
          Provide brief screening data below so SafetyLink can automatically configure extra-friendly visual, auditory, and physical tactile aids.
        </p>

        {/* Screening Question */}
        <div className="space-y-2 pt-1">
          <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Primary Screen Selection:</label>
          <select
            value={disabilityType}
            onChange={(e) => {
              const val = e.target.value;
              setDisabilityType(val);
              // Auto-enable recommended aids
              if (val === "visual") {
                setHighContrast(true);
                setDisabilityAids(["high_contrast", "text_to_speech"]);
              } else if (val === "auditory") {
                setDisabilityAids(["visual_strobe", "haptic_pulse"]);
              } else if (val === "dexterity") {
                setDisabilityAids(["quick_hold", "tactical_volume"]);
              } else {
                setDisabilityAids([]);
                setHighContrast(false);
              }
            }}
            className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
          >
            <option value="none">No Specific Impairments (Standard Mode)</option>
            <option value="visual">Visual Impairment (Low Vision / Color Blind)</option>
            <option value="auditory">Auditory Impairment (Hard of Hearing / Deaf)</option>
            <option value="dexterity">Physical / Dexterity Constraints (Limited Movement)</option>
            <option value="cognitive">Cognitive / Focus Friendly (Autism / Simplified HUD)</option>
          </select>
        </div>

        {/* Assistive Aid Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-900">
          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">Activated Accessibility Aids:</span>

          {/* High Contrast */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-850">
            <div className="text-left max-w-[190px]">
              <span className="text-[9px] font-bold text-slate-200 block flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                High-Contrast Contrast Hud
              </span>
              <p className="text-[7.5px] text-slate-500 leading-none mt-0.5">Shifts phone simulator UI to maximum contrast yellow-on-black.</p>
            </div>
            <input 
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-500 rounded focus:ring-0"
            />
          </div>

          {/* Visual Strobe Flash */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-850">
            <div className="text-left max-w-[190px]">
              <span className="text-[9px] font-bold text-slate-200 block flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                Emergency Visual Flash Strobe
              </span>
              <p className="text-[7.5px] text-slate-500 leading-none mt-0.5">Triggers bright flashing phone background during alarms.</p>
            </div>
            <input 
              type="checkbox"
              checked={disabilityAids.includes("visual_strobe")}
              onChange={() => toggleAid("visual_strobe")}
              className="w-3.5 h-3.5 text-indigo-500 rounded focus:ring-0"
            />
          </div>

          {/* Text-To-Speech Speech Dispatch */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-850">
            <div className="text-left max-w-[190px]">
              <span className="text-[9px] font-bold text-slate-200 block flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Text-to-Speech Dispatch Vocalizer
              </span>
              <p className="text-[7.5px] text-slate-500 leading-none mt-0.5">Reads dispatcher response alerts aloud using voice synthesis.</p>
            </div>
            <input 
              type="checkbox"
              checked={disabilityAids.includes("text_to_speech")}
              onChange={() => toggleAid("text_to_speech")}
              className="w-3.5 h-3.5 text-indigo-500 rounded focus:ring-0"
            />
          </div>

          {/* Haptic vibration simulator */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-850">
            <div className="text-left max-w-[190px]">
              <span className="text-[9px] font-bold text-slate-200 block flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Continuous Rhythmic Audio Beeps
              </span>
              <p className="text-[7.5px] text-slate-500 leading-none mt-0.5">Generates pulsating tones and sounds to guide orientation.</p>
            </div>
            <input 
              type="checkbox"
              checked={disabilityAids.includes("haptic_pulse")}
              onChange={() => toggleAid("haptic_pulse")}
              className="w-3.5 h-3.5 text-indigo-500 rounded focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Styled MEDICAL ID CARD - Tactical Star of Life / Medical Blue */}
      <div className="relative overflow-hidden bg-slate-950 p-4.5 rounded-3xl border border-blue-500/25 space-y-3.5 shadow-xl">
        <div className="absolute top-0 right-0 bg-blue-500/10 border-l border-b border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl">
          CRITICAL RESCUE ID
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-950/40 text-blue-400 rounded-xl border border-blue-500/20">
            <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide">First Responder Bio-ID</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase font-mono">Synced on local lockscreen</p>
          </div>
        </div>

        {/* Display Medical Summary Card Grid */}
        <div className="grid grid-cols-2 gap-2 text-left pt-1">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850">
            <span className="text-[7px] text-slate-500 font-bold uppercase block tracking-wider font-mono">Blood Group:</span>
            <span className="text-sm font-extrabold text-rose-400">{bloodType}</span>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850">
            <span className="text-[7px] text-slate-500 font-bold uppercase block tracking-wider font-mono">Allergies:</span>
            <span className="text-[10px] font-bold text-slate-200 truncate block">
              {allergies || "No Known Allergies"}
            </span>
          </div>
        </div>

        {/* Notes Preview */}
        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 text-left">
          <span className="text-[7px] text-slate-500 font-bold uppercase block tracking-wider font-mono">Clinical Dispatch Notes:</span>
          <p className="text-[9px] text-slate-300 font-semibold leading-relaxed mt-1">
            {medNotes || "No specific paramedic notes provided."}
          </p>
        </div>
      </div>

      {/* Edit Form: General Account details */}
      <form onSubmit={handleProfileSave} className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3.5 shadow-inner">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4.5 h-4.5 text-slate-400" />
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Account Coordinates</span>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Citizen Name:</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-200"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Callsign phone:</label>
            <input
              type="text"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-emerald-500 text-slate-200"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Location bio notes:</label>
            <input
              type="text"
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-200"
              placeholder="e.g. Unit 4, Orange Estate"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-850 text-emerald-400 font-bold text-xs py-2 rounded-xl transition border border-slate-850 cursor-pointer shadow flex items-center justify-center gap-1.5 font-mono tracking-wider text-[10px] uppercase"
        >
          <Check className="w-3.5 h-3.5" />
          Synchronize Profile & Screenings
        </button>
      </form>

      {/* Edit Form: Medical Profile details */}
      <form onSubmit={handleMedicalSave} className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3.5 shadow-inner">
        <div className="flex items-center gap-2">
          <Heart className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Lockscreen Medical ID</span>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Blood Type:</label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-200"
            >
              <option value="A+">A Rh Positive (A+)</option>
              <option value="A-">A Rh Negative (A-)</option>
              <option value="B+">B Rh Positive (B+)</option>
              <option value="B-">B Rh Negative (B-)</option>
              <option value="AB+">AB Rh Positive (AB+)</option>
              <option value="AB-">AB Rh Negative (AB-)</option>
              <option value="O+">O Rh Positive (O+)</option>
              <option value="O-">O Rh Negative (O-)</option>
            </select>
          </div>

          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Known Allergies:</label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Bee stings"
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-200"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Chronic Medications:</label>
            <input
              type="text"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="e.g. Insulin, Lisinopril"
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-200"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Medical Dispatch Notes:</label>
            <textarea
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Inhaler inside front backpack. High blood pressure history."
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-200 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5 font-mono tracking-wider text-[10px] uppercase"
        >
          <Check className="w-3.5 h-3.5" />
          Update Critical Rescue Bio
        </button>
      </form>
    </div>
  );
}
