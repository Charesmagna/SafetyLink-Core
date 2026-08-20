const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

if (!code.includes('onBackToSite')) {
  code = code.replace(
    /export const AuthScreen: React\.FC = \(\) => \{/,
    `export const AuthScreen: React.FC<{ onBackToSite?: () => void }> = ({ onBackToSite }) => {`
  );
  
  // Add the "Return to Website" button at the bottom of the LOGIN view
  const loginButtons = `<button
                    onClick={() => setView('REGISTER_ORG')}
                    className="w-full py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-[10px] tracking-widest uppercase transition-all"
                  >
                    REGISTER ORGANIZATION
                  </button>`;
                  
  const newLoginButtons = loginButtons + `\n                  {onBackToSite && (
                    <button
                      onClick={onBackToSite}
                      className="w-full py-3.5 bg-transparent border border-amber-500/30 hover:bg-amber-500/10 text-amber-500 font-bold rounded-2xl text-[10px] tracking-widest uppercase transition-all mt-4 flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-arrow-left"></i> RETURN TO MAIN WEBSITE
                    </button>
                  )}`;
                  
  code = code.replace(loginButtons, newLoginButtons);
  fs.writeFileSync('src/components/AuthScreen.tsx', code);
  console.log("Patched AuthScreen");
}
