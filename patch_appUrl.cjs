const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  useEffect(() => {
    const backButtonListener = CapApp.addListener('backButton', () => {`;

const replacement = `  useEffect(() => {
    const urlOpenListener = CapApp.addListener('appUrlOpen', data => {
      console.log('App opened with URL:', data);
      try {
        const url = new URL(data.url);
        if (url.searchParams.has('ref')) {
          const refCode = url.searchParams.get('ref');
          if (refCode) localStorage.setItem('sl_pending_referral', refCode);
        }
      } catch (e) {
        console.warn('Failed to parse incoming deep link url:', e);
      }
    });

    const backButtonListener = CapApp.addListener('backButton', () => {`;

const targetEnd = `    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [isSosActive, isDrawerOpen, activeTab, setShowExitConfirm]);`;

const replacementEnd = `    return () => {
      urlOpenListener.then(listener => listener.remove());
      backButtonListener.then(listener => listener.remove());
    };
  }, [isSosActive, isDrawerOpen, activeTab, setShowExitConfirm]);`;


if (content.includes(target) && content.includes(targetEnd)) {
  content = content.replace(target, replacement);
  content = content.replace(targetEnd, replacementEnd);
  fs.writeFileSync('src/App.tsx', content);
  console.log("App.tsx appUrlOpen patched successfully");
} else {
  console.log("Target not found in App.tsx appUrlOpen");
}
