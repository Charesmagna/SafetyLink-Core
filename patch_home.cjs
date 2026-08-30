const fs = require('fs');
let content = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

const TRANSLATIONS = `
const TRANSLATIONS: Record<string, { h1a: string, h1b: string, sub: string }> = {
  en:  { h1a:'SAFETY FOR YOUR FAMILY AND', h1b:'HOUSEHOLD',    sub:'Peace of mind STARTS AT HOME. Protect what matters most – your family and your home.' },
  zu:  { h1a:'UKUPHEPHA KOMNDENI WAKHO',   h1b:'IKHAYA',        sub:'Ukuthula kwengqondo kuQALA EKHAYA. Vikela okukubalulekile.' },
  af:  { h1a:'VEILIGHEID VIR JOU GESIN EN',h1b:'HUISHOUDING',   sub:'Gemoedsrus BEGIN TUIS. Beskerm wat die meeste saakmaak.' },
  xh:  { h1a:'UKHUSELEKO LOSAPHO LWAKHO',  h1b:'IKHAYA',        sub:'Ukuzola kwengqondo kuQALA EKHAYA. Khusela okubalulekileyo.' },
  st:  { h1a:'TSHIRELETSO YA LELAPA',      h1b:'LAPENG',        sub:'Kgotso ya kelello e qala habo. Sireletsa se hlokehang.' },
  tn:  { h1a:'TSHIRELETSO YA LELWAPA',     h1b:'LAPENG',        sub:'Kagiso ya kelelo e simolola gago. Sireletsa se tlhokegang.' },
  ts:  { h1a:'ANTSWISO YA NDYANGU',        h1b:'KAYA',          sub:'Ku rula ka miehleketo ku sungula kaya. Hlayisa leswi fambisanaka.' },
  ss:  { h1a:'KUVIKELWA KWEMNDENI',        h1b:'EKHAYA',        sub:'Kuthula kwenhlitiyo kweQALA EKHAYA. Vikela loko kubalulekile.' },
  ve:  { h1a:'VHUSIRELE HA MUVHUSO',       h1b:'HAYANI',        sub:'Vhutondoli vhu sumbedzela hayani. Vhusirele zwine zwa vha muhulwane.' },
  nr:  { h1a:'UKUVIKELWA KOMNDENI',        h1b:'EKHAYA',        sub:'Ukuthula kwenhliziyo kuqala ekhaya. Vikela okuyimqoka.' },
  nso: { h1a:'TSHIRELETSO YA LELOKO',      h1b:'LAPENG',        sub:'Kgotso ya kelelo e thoma lapeng. Sireletsa seo se hlokegago.' },
};
export function Home`;

content = content.replace('export function Home', TRANSLATIONS);

const STATE_VAR = `
  const [language, setLanguage] = useState("en");
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isScrolled, setIsScrolled] = useState(false);`;

content = content.replace('  const [isScrolled, setIsScrolled] = useState(false);', STATE_VAR);

const SELECT_ELEMENT = `
            <div style={{display:'flex', gap:'12px', alignItems:'center', marginLeft:'12px'}}>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '6px 9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                <option value="en">🌐 ENGLISH</option>
                <option value="zu">🌐 ZULU</option>
                <option value="af">🌐 AFRIKAANS</option>
                <option value="xh">🌐 XHOSA</option>
                <option value="st">🌐 SESOTHO</option>
                <option value="tn">🌐 SETSWANA</option>
                <option value="ts">🌐 TSONGA</option>
                <option value="ss">🌐 SWATI</option>
                <option value="ve">🌐 VENDA</option>
                <option value="nr">🌐 NDEBELE</option>
                <option value="nso">🌐 SEPEDI</option>
              </select>
              <button onClick={onLogin}`;

content = content.replace(/            <div style={{display:'flex', gap:'12px', alignItems:'center', marginLeft:'12px'}}>\n              <button onClick={onLogin}/, SELECT_ELEMENT);

const HERO_HEADLINE = `
            <div className="hero-eyebrow"><div className="hero-dot"></div>Live in South Africa</div>
            <h1>{t.h1a} <span className="g">{t.h1b}</span></h1>
            <p className="hero-sub" style={{ color: '#334155', fontWeight: 500 }}>{t.sub}</p>`;

content = content.replace(/            <div className="hero-eyebrow"><div className="hero-dot"><\/div>Live in South Africa<\/div>\n            <h1>SAFETY FOR YOUR FAMILY AND <span className="g">HOUSE HOLD<\/span><\/h1>\n            <p className="hero-sub" style={{ color: '#334155', fontWeight: 500 }}>Peace of mind STARTS AT HOME. Protect what matters most – your family and your home. Seamless end-to-end protection, from key fob to app.<\/p>/, HERO_HEADLINE);

fs.writeFileSync('src/components/landing/Home.tsx', content, 'utf8');
console.log("Patched Home.tsx");
