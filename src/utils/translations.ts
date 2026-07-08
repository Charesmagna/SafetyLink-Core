// SafetyLink Core Translation System (South African Multi-Language Mesh)

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  status: 'preloaded' | 'downloadable' | 'downloading' | 'downloaded';
}

export const SA_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇿🇦', status: 'preloaded' },
  { code: 've', name: 'Tshivenda', nativeName: 'Tshivenda', flag: '🇿🇦', status: 'preloaded' },
  { code: 'zu', name: 'isiZulu', nativeName: 'isiZulu', flag: '🇿🇦', status: 'downloadable' },
  { code: 'xh', name: 'isiXhosa', nativeName: 'isiXhosa', flag: '🇿🇦', status: 'downloadable' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', status: 'downloadable' },
  { code: 'nso', name: 'Sepedi', nativeName: 'Sepedi (Northern Sotho)', flag: '🇿🇦', status: 'downloadable' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho (Southern Sotho)', flag: '🇿🇦', status: 'downloadable' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', flag: '🇿🇦', status: 'downloadable' },
  { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga', flag: '🇿🇦', status: 'downloadable' },
  { code: 'ss', name: 'Siswati', nativeName: 'SiSwati', flag: '🇿🇦', status: 'downloadable' },
  { code: 'nr', name: 'isiNdebele', nativeName: 'isiNdebele', flag: '🇿🇦', status: 'downloadable' }
];

export const translationDicts: Record<string, Record<string, string>> = {
  en: {
    // Top bars / Status
    'status.secure': 'SAFETY SECURE STATUS: ARMED & ACTIVE',
    'status.emergency': '⚠️ EMERGENCY DISTRESS BROADCAST BEACON ACTIVE ⚠️',
    'status.drill': 'DRILL MODE ACTIVE - SMS/CALLS ARE SIMULATED',
    
    // Header
    'header.powered': 'POWERED BY TM MEDIA SOLUTIONS',
    'header.signout': 'Sign Out',
    
    // Tabs
    'tab.home': 'Home',
    'tab.contacts': 'Contacts',
    'tab.ble': 'Beacons',
    'tab.map': 'Map',
    'tab.settings': 'Settings',

    // Home / Panic
    'home.reassurance_title': 'You are fully protected',
    'home.reassurance_subtitle': 'SafetyLink monitors your background telemetry and coordinates with armed patrol escorts. Press the red actuator below in any distress scenario.',
    'home.trigger_desc_placeholder': 'Describe your immediate situation (optional)...',
    'home.drill_label': 'TEST DRILL MODE ACTIVE',
    'home.drill_desc': 'Dispatches will be simulated on local ledger.',
    'home.armed_label': 'BEACON SYSTEM ARMED',
    'home.armed_desc': 'Standby for instant distress trigger.',
    
    // Settings / Audit Log
    'settings.title': 'System Core Diagnostics',
    'settings.subtitle': 'Local auditing & administrative telemetry',
    'settings.diagnostics_title': 'Actuator Diagnostic Controls',
    'settings.diagnose_btn': '💻 SELF-DIAGNOSE',
    'settings.purge_btn': '🗑️ PURGE AUDIT LOG',
    'settings.shortcut_title': 'Homescreen Quick Shortcut ACTUATOR',
    'settings.shortcut_name': 'RED CIRCLE PANIC ACTUATOR',
    'settings.shortcut_desc': 'Install a high-contrast Red Circle widget to bypass locks and trigger direct security cascades.',
    'settings.ledger_title': 'Tactical Security Ledger',
    'settings.events_badge': 'EVENTS',
    'settings.language_title': 'Language & Localization Support',
    'settings.language_subtitle': 'Configure primary interface language & South African packages',
    'settings.download_language': 'Download Other SA Languages',
    'settings.downloading': 'Downloading...',
    'settings.download_btn': 'Download',
    'settings.preloaded': 'Preloaded',
    'settings.downloaded': 'Downloaded',
    'settings.download_success': 'Language package downloaded successfully!',
    
    // Auth & BIND iTAG Wizard
    'auth.welcome': 'SafetyLink Gateway',
    'auth.pair_title': 'Configure Wearable iTAG',
    'auth.pair_desc': 'Pair your Bluetooth BLE tracker keyfob to trigger instant physical distress signals.',
    'auth.scan_btn': 'Scan Nearby Beacons',
    'auth.stop_scan_btn': 'Stop Scan',
    'auth.pairing_active': 'PAIRING ACTIVE',
    'auth.bind_btn': 'BIND TAG',
    'auth.skip_btn': 'Skip & Continue to Sign In →',
    'auth.beacons_anytime': 'You can pair or manage physical wearables at any time via the Beacons tab on your central dashboard.'
  },
  ve: {
    // Top bars / Status
    'status.secure': 'TSHIMO YA TSIRELEDZO: YO VHULAHEDZWA NAHONE I KHOU SHUMA',
    'status.emergency': '⚠️ THASULULO YA SHANGO I KHOU SHUMA NAHONE I KHOU GUDISWA ⚠️',
    'status.drill': 'MULINGO WA SOS U KHOU SHUMA - ZWINYADZO ZWI KHOU EDZISWA',
    
    // Header
    'header.powered': 'I TSHIMBIDZWA NGA TM MEDIA SOLUTIONS',
    'header.signout': 'U bva',
    
    // Tabs
    'tab.home': 'Hayani',
    'tab.contacts': 'Vhadavhidzani',
    'tab.ble': 'Bikhoni (BLE)',
    'tab.map': 'Mabe',
    'tab.settings': 'Sethingi',

    // Home / Panic
    'home.reassurance_title': 'Ni tsireledzekile tshoṱhe',
    'home.reassurance_subtitle': 'SafetyLink i sedza vhupo hanu na u davhidzana na mapholisa a tsireledzo. Kandani tshiambara tswuku afho fhasi kha thasululo iṅwe na iṅwe.',
    'home.trigger_desc_placeholder': 'Talusani nyimele ya khombo (zwi a tendelwa u fhira)...',
    'home.drill_label': 'MULINGO WA SOS U KHOU SHUMA',
    'home.drill_desc': 'Thasululo dzi do edziswa kha danga la sisiteme.',
    'home.armed_label': 'SISITEME YA BIKHONI YO ARMIWA',
    'home.armed_desc': 'I khou lindela u kandwa ha SOS.',
    
    // Settings / Audit Log
    'settings.title': 'Tsedzuluso ya Phurogireme ya Sisiteme',
    'settings.subtitle': 'Mbekanyamushumo ya u thonifha na u vhiga zwiitisi',
    'settings.diagnostics_title': 'Tsedzuluso ya Sisiteme',
    'settings.diagnose_btn': '💻 TSEḌULUSO YA VHUTHO',
    'settings.purge_btn': '🗑️ PHURGE MUVHIGO',
    'settings.shortcut_title': 'Nila ya u kanda SOS yo vhulelaho hune ra dzula',
    'settings.shortcut_name': 'TSHIAMBARA TSWUKU TSHA SOS',
    'settings.shortcut_desc': 'Mbekanyamushumo ya u vhea tshikandwa tswuku kha u dzhia SOS yo lulamela u bypass u vhulahedzwa ha founu.',
    'settings.ledger_title': 'Lega ya Tsireledzo ya Ndavhelo',
    'settings.events_badge': 'ZWIITISI',
    'settings.language_title': 'Ndavhelo ya Luambo na Ndulamiso',
    'settings.language_subtitle': 'Khethani luambo lune lwa khou shumiswa na u dounilouda dziṅwe nyimele dza Afrika Tshipembe',
    'settings.download_language': 'Dounilouda Dziṅwe Nyimele dza SA',
    'settings.downloading': 'I khou kulumisa...',
    'settings.download_btn': 'Kulumisa',
    'settings.preloaded': 'Yo no vhewa',
    'settings.downloaded': 'Yo kulumiswa',
    'settings.download_success': 'Phekheji ya luambo yo kulumiswa zwavhudi!',
    
    // Auth & BIND iTAG Wizard
    'auth.welcome': 'Mulingo wa SafetyLink',
    'auth.pair_title': 'Lungisani iTAG yo vhulelaho',
    'auth.pair_desc': 'Panyisani bikhoni ya Bluetooth (BLE) u vhulahedza thasululo ya vhupo.',
    'auth.scan_btn': 'Seda Bikhoni dza Tsini',
    'auth.stop_scan_btn': 'Fhedza u Seda',
    'auth.pairing_active': 'PANYISO I KHOU SHUMA',
    'auth.bind_btn': 'VHULAHA TAG',
    'auth.skip_btn': 'Fhira u ye u Dzhena →',
    'auth.beacons_anytime': 'Ni nga panyisa na u laula zwiambara zwa bikhoni ngezwiṅwe zwifhinga kha danga la Bikhoni.'
  },
  // Downloaded languages will inject their translated text dynamically!
  zu: {
    'status.secure': 'ISIMO SOKUPHEPHA: SAMUKELWE FUTHI SIYASEBENZA',
    'status.emergency': '⚠️ ISIKHALAZO SEZEMIDLALO SIYASEBENZA ⚠️',
    'status.drill': 'INDLELA YOKUZIVIKELA IYASEBENZA - IZIKHALAZO ZIYAFANISWA',
    'header.powered': 'IPHATHWE NGE-TM MEDIA SOLUTIONS',
    'header.signout': 'Phuma',
    'tab.home': 'Ikhaya',
    'tab.contacts': 'Oxhumana nabo',
    'tab.ble': 'Amabhikhoni',
    'tab.map': 'Imephu',
    'tab.settings': 'Izilungiselelo',
    'home.reassurance_title': 'Uvikeleke ngokugcwele',
    'home.reassurance_subtitle': 'ISafetyLink iqapha indawo yakho ngezikhathi zonke. Cindezela inkinobho ebomvu ngezansi kunoma yisiphi isimo esibucayi.',
    'home.trigger_desc_placeholder': 'Chaza isimo sakho (uma uthanda)...',
    'home.drill_label': 'INDLELA YOMDLALO IYASEBENZA',
    'home.drill_desc': 'Ukuvuselelwa kuzofaniswa ohlwini lwendawo.',
    'home.armed_label': 'UHLELO ARMED',
    'home.armed_desc': 'Lindela inkinobho yenhlekelele.',
    'settings.title': 'Ukuxilongwa Kwekhori Yesistimu',
    'settings.subtitle': 'Izilungiselelo zendawo kanye nemibiko ye-alamu',
    'settings.diagnostics_title': 'Izilawuli Zokuxilonga ezisebenzayo',
    'settings.diagnose_btn': '💻 XILONGA ISISTIMU',
    'settings.purge_btn': '🗑️ SUSA I-LOG YOMBIKO',
    'settings.shortcut_title': 'Indlela Enqamulelayo Yesikrini Sasekhaya',
    'settings.shortcut_name': 'INKINOBHO EBOMLVU YENHLEKELELE',
    'settings.shortcut_desc': 'Faka inkinobho ebomvu esikrinini sasekhaya ukuze uthumele usizo ngokushesha ungapasi isikrini esikhiyiwe.',
    'settings.ledger_title': 'Idayari Yokuphepha',
    'settings.events_badge': 'IMICIMBI',
    'settings.language_title': 'Ulimi Nokuhunyushwa',
    'settings.language_subtitle': 'Lungiselela ulimi oluyisisekelo lwesixhumi esibonakalayo kanye namaphakheji waseNingizimu Afrika',
    'settings.download_language': 'Landa Ezinye Izilimi zase-SA',
    'settings.downloading': 'Iyalanda...',
    'settings.download_btn': 'Landa',
    'settings.preloaded': 'Kulayishwe kuqala',
    'settings.downloaded': 'Ilandiwe',
    'settings.download_success': 'Iphakethe lolimi lilandwe ngempumelelo!',
    'auth.welcome': 'Isango le-SafetyLink',
    'auth.pair_title': 'Lungiselela iTAG Egqokwayo',
    'auth.pair_desc': 'Xhuma i-GATT profile yebhikhoni ye-Bluetooth ukuze uqalise i-alamu yenhlekelele yomzimba.',
    'auth.scan_btn': 'Skena Amabhikhoni Aseduze',
    'auth.stop_scan_btn': 'Misa Ukuskena',
    'auth.pairing_active': 'UKUXHUMANISA KUPHELELE',
    'auth.bind_btn': 'XHUMA TAG',
    'auth.skip_btn': 'Yeqa & Qhubekela Phambili →',
    'auth.beacons_anytime': 'Ungaxhuma amabhikhoni nganoma yisiphi isikhathi kuthebhu yamabhikhoni.'
  },
  xh: {
    'status.secure': 'IMO YOKHUSELEKO: IXHOTYISIWE KWAYE IYASEBENZA',
    'status.emergency': '⚠️ ISIBANE SOPHAZAMISEKO SIYASEBENZA ⚠️',
    'tab.home': 'Ikhaya',
    'tab.contacts': 'Abafowunelwa',
    'tab.ble': 'Amabhikhoni',
    'tab.map': 'Imephu',
    'tab.settings': 'Izicwangciso',
    'header.signout': 'Phuma',
    'home.reassurance_title': 'Khuselekile ngokupheleleyo',
    'home.reassurance_subtitle': 'ISafetyLink ihlala ijonga indawo yakho. Cofa iqhosha elibomvu ngezantsi kuyo nayiphi na imeko engxamisekileyo.',
    'settings.language_title': 'Ulwimi noToliko',
    'settings.language_subtitle': 'Cwangcisa ulwimi lwakho lwasentshona kunye neepakethe zeelwimi zaseMzantsi Afrika'
  }
};

// Simple helper function to get translated terms
export function translate(lang: string, key: string): string {
  const currentLang = lang || 'en';
  const dict = translationDicts[currentLang] || translationDicts['en'];
  
  if (dict[key]) return dict[key];
  
  // Fallback to English
  const englishDict = translationDicts['en'];
  return englishDict[key] || key;
}
