const fs = require('fs');
let code = fs.readFileSync('src/components/KlevaBot.tsx', 'utf8');

code = code.replace(
`import { Send, X, MapPin } from "lucide-react";`,
`import { Send, X, MapPin, Volume2, VolumeX } from "lucide-react";
import { getLizzyProvider } from '../services/LizzyAIProvider';`
);

code = code.replace(
`  const [isTyping, setIsTyping] = useState(false);`,
`  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);`
);

code = code.replace(
`      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: botResponse, timestamp: Date.now() },
      ]);
      setIsTyping(false);`,
`      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: botResponse, timestamp: Date.now() },
      ]);
      setIsTyping(false);
      
      if (voiceEnabled) {
        getLizzyProvider().speak(botResponse).catch(console.error);
      }`
);

code = code.replace(
`                <button
                  onClick={() => setIsOpen(false)}`,
`                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="p-1.5 mr-2 rounded-full hover:bg-slate-800/60 border border-slate-850 text-slate-400 hover:text-white transition-colors"
                >
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}`
);

fs.writeFileSync('src/components/KlevaBot.tsx', code);
