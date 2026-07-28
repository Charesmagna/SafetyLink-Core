// SafetyLink Core Translation System (South African Multi-Language Mesh)

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  status: 'preloaded' | 'downloadable' | 'downloading' | 'downloaded';
}

export const SA_LANGUAGES: LanguageMeta[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'Hindi', flag: '🇿🇦', status: 'downloadable' },
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
  
  hi: {
    'status.secure': 'सुरक्षा सुरक्षित स्थिति: सशस्त्र और सक्रिय',
    'status.emergency': '⚠️ आपातकालीन संकट प्रसारण बीकन सक्रिय ⚠️',
    'status.drill': 'ड्रिल मोड सक्रिय - एसएमएस/कॉल सिम्युलेटेड हैं',
    'header.powered': 'टीएम मीडिया सॉल्यूशंस द्वारा संचालित',
    'header.signout': 'साइन आउट',
    'tab.home': 'होम',
    'tab.contacts': 'संपर्क',
    'tab.ble': 'बीकन',
    'tab.map': 'नक्शा',
    'tab.settings': 'सेटिंग्स',
    'tab.subsystems': 'सबसिस्टम',
    'home.reassurance_title': 'आप पूरी तरह से सुरक्षित हैं',
    'home.reassurance_subtitle': 'सेफ्टीलिंक आपकी पृष्ठभूमि टेलीमेट्री पर नज़र रखता है और सशस्त्र गश्ती एस्कॉर्ट्स के साथ समन्वय करता है। किसी भी संकट की स्थिति में नीचे लाल एक्ट्यूएटर दबाएं।',
    'home.trigger_desc_placeholder': 'अपनी तत्काल स्थिति का वर्णन करें (वैकल्पिक)...',
    'home.drill_label': 'टेस्ट ड्रिल मोड सक्रिय',
    'home.drill_desc': 'डिस्पैच को स्थानीय लेजर पर सिम्युलेट किया जाएगा।',
    'home.armed_label': 'बीकन सिस्टम सशस्त्र',
    'home.armed_desc': 'तत्काल संकट ट्रिगर के लिए स्टैंडबाय।',
    'settings.title': 'सिस्टम कोर डायग्नोस्टिक्स',
    'settings.subtitle': 'स्थानीय ऑडिटिंग और प्रशासनिक टेलीमेट्री',
    'settings.diagnostics_title': 'एक्ट्यूएटर डायग्नोस्टिक कंट्रोल',
    'settings.diagnose_btn': '💻 सेल्फ-डायग्नोस',
    'settings.purge_btn': '🗑️ ऑडिट लॉग को साफ करें',
    'settings.shortcut_title': 'होमस्क्रीन क्विक शॉर्टकट एक्ट्यूएटर',
    'settings.shortcut_name': 'रेड सर्कल पैनिक एक्ट्यूएटर',
    'settings.shortcut_desc': 'ताले को बायपास करने और सीधे सुरक्षा कैस्केड को ट्रिगर करने के लिए एक उच्च-कंट्रास्ट रेड सर्कल विजेट स्थापित करें।',
    'settings.ledger_title': 'सामरिक सुरक्षा लेजर',
    'settings.events_badge': 'घटनाएँ',
    'settings.language_title': 'भाषा और स्थानीयकरण समर्थन',
    'settings.language_subtitle': 'प्राथमिक इंटरफ़ेस भाषा और दक्षिण अफ़्रीकी पैकेज कॉन्फ़िगर करें',
    'settings.download_language': 'अन्य SA भाषाएँ डाउनलोड करें',
    'settings.downloading': 'डाउनलोड हो रहा है...',
    'settings.download_btn': 'डाउनलोड',
    'settings.preloaded': 'प्रीलोडेड',
    'settings.downloaded': 'डाउनलोड किया गया',
    'settings.download_success': 'भाषा पैकेज सफलतापूर्वक डाउनलोड किया गया!'
  },
  zu: {
    'status.secure': 'ISIMO SOKUPHEPHA: IHLOMILE FUTHI IYASEBENZA',
    'status.emergency': '⚠️ ISIMO EZIPHUTHUMAYO SOKUSAKAZA SOS SIYASEBENZA ⚠️',
    'status.drill': 'IMODI YEKUDRILLA IYASEBENZA - AMA-SMS ENZIWE KWAZISWA',
    'header.powered': 'IXHASWE NGE-TM MEDIA SOLUTIONS',
    'header.signout': 'Phuma',
    'tab.home': 'Ikhaya',
    'tab.contacts': 'Oxhumana nabo',
    'tab.ble': 'Ama-Beacons',
    'tab.map': 'Imephu',
    'tab.settings': 'Amasethingi',
    'tab.subsystems': 'Amasistimu amancane',
    'home.reassurance_title': 'Uvikelwe ngokuphelele',
    'home.reassurance_subtitle': 'I-SafetyLink iqapha imininingwane yakho yasemuva futhi ihlanganyele nonogada abahlomile. Cindezela inkinobho ebomvu ngezansi kunoma yisiphi isimo sokucindezeleka.',
    'home.trigger_desc_placeholder': 'Chaza isimo sakho esiphuthumayo (uma uthanda)...',
    'home.drill_label': 'IMODI YOKUHLOLA IYASEBENZA',
    'home.drill_desc': 'Ukusatshalaliswa kuzokwenziwa ohlelweni lwendawo.',
    'home.armed_label': 'UHLELO LWE-BEACON LUHLOMILE',
    'home.armed_desc': 'Lindela ukucupha kwesimo esiphuthumayo.',
    'settings.title': 'Ukuxilongwa Kwe-System Core',
    'settings.subtitle': 'Ukuhlola kwendawo kanye netelemetry yokuphatha',
    'settings.diagnostics_title': 'Izilawuli Zokuxilonga Zenkinobho',
    'settings.diagnose_btn': '💻 ZIHLOLE WENA',
    'settings.purge_btn': '🗑️ SUSA UMLANDO WEZENZAKALO',
    'settings.shortcut_title': 'Inkinobho Yesinqamuleli Sasekhaya',
    'settings.shortcut_name': 'INKINOBHO EBOMVU YE-PANIC',
    'settings.shortcut_desc': 'Faka iwijethi eyindilinga ebomvu enomehluko omkhulu ukuze udlule okhiye bese ucupha izexwayiso zokuphepha eziqondile.',
    'settings.ledger_title': 'I-Ledger Yezokuphepha Yeqhinga',
    'settings.events_badge': 'IZENZAKALO',
    'settings.language_title': 'Ukusekelwa Kolimi Nezokwenza Indawo',
    'settings.language_subtitle': 'Lungiselela ulimi lwesixhumi esibonakalayo namaphakheji waseNingizimu Afrika',
    'settings.download_language': 'Landa Ezinye Izilimi ze-SA',
    'settings.downloading': 'Iyalanda...',
    'settings.download_btn': 'Landa',
    'settings.preloaded': 'Ilayishwe kuqala',
    'settings.downloaded': 'Ilandiwe',
    'settings.download_success': 'Iphakheji yolimi ilandwe ngempumelelo!'
  },
  af: {
    'status.secure': 'VEILIGHEIDSTATUS: GEWAPEN EN AKTIEF',
    'status.emergency': '⚠️ NOODSAITSAAIBAKEN AKTIEF ⚠️',
    'status.drill': 'OEFENMODUS AKTIEF - SMS/Oproepe word gesimuleer',
    'header.powered': 'AANGEDRYF DEUR TM MEDIA SOLUTIONS',
    'header.signout': 'Teken Uit',
    'tab.home': 'Tuis',
    'tab.contacts': 'Kontakte',
    'tab.ble': 'Bakens',
    'tab.map': 'Kaart',
    'tab.settings': 'Instellings',
    'tab.subsystems': 'Substelsels',
    'home.reassurance_title': 'Jy is ten volle beskerm',
    'home.reassurance_subtitle': 'SafetyLink monitor jou agtergrondtelemetrie en koördineer met gewapende patrolliebegeleidings. Druk die rooi aktueerder hieronder in enige noodsituasie.',
    'home.trigger_desc_placeholder': 'Beskryf jou onmiddellike situasie (opsioneel)...',
    'home.drill_label': 'TOETS OEFENMODUS AKTIEF',
    'home.drill_desc': 'Uitstuur sal op die plaaslike grootboek gesimuleer word.',
    'home.armed_label': 'BAKENSTELSEL GEWAPEN',
    'home.armed_desc': 'Gereed vir onmiddellike noodsneller.',
    'settings.title': 'Stelsel Kern Diagnostiek',
    'settings.subtitle': 'Plaaslike ouditering en administratiewe telemetrie',
    'settings.diagnostics_title': 'Aktueerder Diagnostiese Kontroles',
    'settings.diagnose_btn': '💻 SELF-DIAGNOSE',
    'settings.purge_btn': '🗑️ VEE OUDITLOG UIT',
    'settings.shortcut_title': 'Tuisskerm Vinnige Kortpad Aktueerder',
    'settings.shortcut_name': 'ROOI SIRKEL PANIEKAKTUEERDER',
    'settings.shortcut_desc': "Installeer 'n hoë-kontras Rooi Sirkel legstuk om slotte te omseil en direkte veiligheidskaskades te aktiveer.",
    'settings.ledger_title': 'Taktiese Veiligheidsgrootboek',
    'settings.events_badge': 'GEBEURE',
    'settings.language_title': 'Taal- en Lokaliseringsondersteuning',
    'settings.language_subtitle': 'Stel die primêre koppelvlaktaal en Suid-Afrikaanse pakkette in',
    'settings.download_language': 'Laai Ander SA Tale Af',
    'settings.downloading': 'Besig om af te laai...',
    'settings.download_btn': 'Laai af',
    'settings.preloaded': 'Vooraf gelaai',
    'settings.downloaded': 'Afgegelaai',
    'settings.download_success': 'Taalpakket suksesvol afgelaai!'
  },
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
    'tab.subsystems': 'Subsystems',

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
    'tab.subsystems': 'Mbekanyamushumo',

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
    'tab.subsystems': 'Izinhlelo',
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
    'tab.subsystems': 'Izicwangciso ezigqithileyo',
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
