const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`    if (!currentUser) {
      if (showLanding) {
        return <LandingPage onLogin={() => setShowLanding(false)} />;
      }
      return <AuthScreen />;
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">`,
`    if (showLanding) {
      return <LandingPage onLogin={() => setShowLanding(false)} onBackToApp={currentUser ? () => setShowLanding(false) : undefined} />;
    }

    if (!currentUser) {
      return <AuthScreen />;
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">`
);

fs.writeFileSync('src/App.tsx', code);
