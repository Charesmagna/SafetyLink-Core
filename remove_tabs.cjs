const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

// Replace {currentView === "..." && (<> with empty
code = code.replace(/\{currentView === "[^"]+" && \(<>\n/g, '');
code = code.replace(/\{currentView === "[^"]+" && \(<>/g, '');
// Replace </>)} with empty
code = code.replace(/<\/>\)}\n/g, '');
code = code.replace(/<\/>\)}/g, '');

// Also change the nav-links to use href="#..." instead of setCurrentView
code = code.replace(/<a href="#" className=\{currentView === 'home' \? 'active' : ''\} onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentView\('home'\); \}\}>Home<\/a>/g, '<a href="#home">Home</a>');
code = code.replace(/<a href="#" className=\{currentView === 'features' \? 'active' : ''\} onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentView\('features'\); \}\}>Features<\/a>/g, '<a href="#features">Features</a>');
code = code.replace(/<a href="#" className=\{currentView === 'usecases' \? 'active' : ''\} onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentView\('usecases'\); \}\}>Use Cases<\/a>/g, '<a href="#usecases">Use Cases</a>');
code = code.replace(/<a href="#" className=\{currentView === 'hardware' \? 'active' : ''\} onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentView\('hardware'\); \}\}>Hardware<\/a>/g, '<a href="#hardware">Hardware</a>');
code = code.replace(/<a href="#" className=\{currentView === 'ai' \? 'active' : ''\} onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentView\('ai'\); \}\}>AI Co-Pilot<\/a>/g, '<a href="#ai">AI Co-Pilot</a>');
code = code.replace(/<a href="#" className=\{currentView === 'pricing' \? 'active' : ''\} onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentView\('pricing'\); \}\}>Pricing<\/a>/g, '<a href="#pricing">Pricing</a>');

fs.writeFileSync('src/components/landing/Home.tsx', code);
