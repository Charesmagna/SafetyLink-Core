const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Fix the malformed inline event handlers 
// onMouseOver={(e) => this.style.color='#fff'" ... this is invalid JSX

code = code.replace(/onMouseOver=\{\(e\) => this\.style\.color='#fff'" onMouseOut=\{\(e\) => this\.style\.color='var\(--muted\)'"/g, "onMouseOver={(e) => e.currentTarget.style.color='#fff'} onMouseOut={(e) => e.currentTarget.style.color='var(--muted)'}");

code = code.replace(/onMouseOver=\{\(e\) => this\.style\.color='#25d366'" onMouseOut=\{\(e\) => this\.style\.color='var\(--muted\)'"/g, "onMouseOver={(e) => e.currentTarget.style.color='#25d366'} onMouseOut={(e) => e.currentTarget.style.color='var(--muted)'}");

fs.writeFileSync('src/components/LandingPage.tsx', code);
