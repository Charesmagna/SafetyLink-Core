const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

// Import PricingModal
if (!code.includes('PricingModal')) {
  code = code.replace(
    "import { LogoSetPart } from './LogoSetPart';",
    "import { LogoSetPart } from './LogoSetPart';\nimport { PricingModal } from './PricingModal';"
  );
}

// Add state for PricingModal
if (!code.includes('showPricing')) {
  code = code.replace(
    "const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);",
    "const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);\n  const [showPricing, setShowPricing] = useState(false);"
  );
}

// Render the modal
if (!code.includes('<PricingModal')) {
  code = code.replace(
    "{showVoiceAssistant && <VoiceAccessibilityAssistant onClose={() => setShowVoiceAssistant(false)} />}",
    "{showVoiceAssistant && <VoiceAccessibilityAssistant onClose={() => setShowVoiceAssistant(false)} />}\n      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />"
  );
}

// Add button to trigger modal
if (!code.includes('setShowPricing(true)')) {
  code = code.replace(
    'title="Voice Accessibility Setup"',
    'title="Voice Accessibility Setup"'
  );
  
  const buttonHtml = `
          <button
            type="button"
            onClick={() => setShowPricing(true)}
            title="View Pricing & Plans"
            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center font-mono text-[9px] font-bold uppercase"
          >
            Plans
          </button>`;
          
  code = code.replace(
    "          <div className=\"text-left flex-1\">",
    buttonHtml + "\n          <div className=\"text-left flex-1\">"
  );
}

fs.writeFileSync('src/components/AuthScreen.tsx', code);
