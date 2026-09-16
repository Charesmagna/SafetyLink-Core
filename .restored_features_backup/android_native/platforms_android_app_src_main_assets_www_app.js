/**
 * SafetyLink Core Engine v3.2
 * Matched to index.html element IDs exactly
 */

const CORE_CONFIG = {
    holdThreshold: 2000,
    bufferWindow: 10,
    defaultLat: -26.3085,
    defaultLon: 27.8344
};

let GlobalState = {
    interactionTimer: null,
    countdownTracker: null,
    pipelineTriggered: false,
    drillModeActive: false,
    operatorName: '',
    operatorPhone: '',
    orgId: '',
    volumePressCount: 0,
    volumeResetTimer: null,
    gisMapEngine: null,
    routingMatrix: {
        primary: '',
        secondary: '',
        tertiary: '',
        whatsapp: '',
        police: ''
    }
};

const DOM = {};

/* ══════════════════════════════════════════
   STARTUP — wait for Cordova to be ready
   ══════════════════════════════════════════ */
document.addEventListener('deviceready', onDeviceReady, false);
document.addEventListener('DOMContentLoaded', onDeviceReady, false);

let _started = false;
function onDeviceReady() {
    if (_started) return;
    _started = true;

    cacheDOMReferences();
    attachEventListeners();
    attachVolumeKeyInterceptor();
    requestRuntimePermissions();
    loadPersistentState();
    logDiagnosticStartup();
}

function cacheDOMReferences() {
    DOM.authScreen       = document.getElementById('auth-screen');
    DOM.consoleScreen    = document.getElementById('console-screen');
    DOM.activateBtn      = document.getElementById('activate-terminal-btn');
    DOM.authName         = document.getElementById('auth-name');
    DOM.authPhone        = document.getElementById('auth-phone');
    DOM.authOrgId        = document.getElementById('auth-org-id');
    DOM.systemStatusLbl  = document.getElementById('system-status-lbl');
    DOM.profileNameLbl   = document.getElementById('profile-name-lbl');
    DOM.profileRoleLbl   = document.getElementById('profile-role-lbl');
    DOM.triggerButton    = document.getElementById('trigger-button');
    DOM.drillToggle      = document.getElementById('drill-mode-toggle');
    DOM.countdownOverlay = document.getElementById('countdown-overlay');
    DOM.countdownText    = document.getElementById('countdown-text');
    DOM.disarmBtn        = document.getElementById('disarm-btn');
    DOM.statusLog        = document.getElementById('diagnostic-ticker-terminal');
    DOM.saveRoutingBtn   = document.getElementById('save-routing-btn');
    DOM.signOutBtn       = document.getElementById('sign-out-btn');
    DOM.inputPrimary     = document.getElementById('input-primary');
    DOM.inputSecondary   = document.getElementById('input-secondary');
    DOM.inputTertiary    = document.getElementById('input-tertiary');
    DOM.inputWhatsapp    = document.getElementById('input-whatsapp');
    DOM.inputPolice      = document.getElementById('input-police');
}

/* ══════════════════════════════════════════
   RUNTIME PERMISSIONS (Android 6+)
   ══════════════════════════════════════════ */
function requestRuntimePermissions() {
    if (typeof cordova === 'undefined') return;
    if (!cordova.plugins || !cordova.plugins.permissions) {
        tick("Permission plugin not found. SMS/Call may be blocked by Android.");
        return;
    }

    const perms = cordova.plugins.permissions;
    perms.requestPermissions(
        [perms.SEND_SMS, perms.CALL_PHONE, perms.ACCESS_FINE_LOCATION],
        (status) => tick("Runtime permissions granted."),
        (err)    => tick("Permission denied. SMS/Call may not work.")
    );
}

/* ══════════════════════════════════════════
   MODULE 1: AUTH
   ══════════════════════════════════════════ */
function attachEventListeners() {

    // ACTIVATE button
    if (DOM.activateBtn) {
        DOM.activateBtn.addEventListener('click', handleActivation);
    }

    // PANIC BUTTON — all event types for maximum compatibility
    if (DOM.triggerButton) {
        DOM.triggerButton.addEventListener('mousedown',   startPanicHold);
        DOM.triggerButton.addEventListener('touchstart',  startPanicHold, { passive: false });
        DOM.triggerButton.addEventListener('pointerdown', startPanicHold);

        DOM.triggerButton.addEventListener('mouseup',    cancelPanicHold);
        DOM.triggerButton.addEventListener('mouseleave', cancelPanicHold);
        DOM.triggerButton.addEventListener('touchend',   cancelPanicHold);
        DOM.triggerButton.addEventListener('pointerup',  cancelPanicHold);
    }

    // DISARM button
    if (DOM.disarmBtn) {
        DOM.disarmBtn.addEventListener('click', disarmPipeline);
    }

    // DRILL MODE toggle
    if (DOM.drillToggle) {
        DOM.drillToggle.addEventListener('click', () => {
            GlobalState.drillModeActive = !GlobalState.drillModeActive;
            DOM.drillToggle.innerText = GlobalState.drillModeActive
                ? 'SYSTEM DRILL / TEST MODE [ON]'
                : 'SYSTEM DRILL / TEST MODE [OFF]';
            DOM.drillToggle.style.color = GlobalState.drillModeActive ? '#f59e0b' : '';
            tick(GlobalState.drillModeActive
                ? "DRILL MODE ON — no real SMS or calls will fire."
                : "DRILL MODE OFF — system is LIVE.");
        });
    }

    // SAVE ROUTING MATRIX
    if (DOM.saveRoutingBtn) {
        DOM.saveRoutingBtn.addEventListener('click', saveContacts);
    }

    // SIGN OUT
    if (DOM.signOutBtn) {
        DOM.signOutBtn.addEventListener('click', () => {
            localStorage.clear();
            DOM.consoleScreen.classList.add('hidden');
            DOM.authScreen.classList.remove('hidden');
            tick("Device de-provisioned.");
        });
    }
}

function handleActivation() {
    const name  = DOM.authName  ? DOM.authName.value.trim()  : '';
    const phone = DOM.authPhone ? DOM.authPhone.value.trim() : '';
    const org   = DOM.authOrgId ? DOM.authOrgId.value.trim() : '';

    if (phone.length < 9) {
        alert("Enter a valid 9-digit phone number.");
        return;
    }

    GlobalState.operatorName  = name;
    GlobalState.operatorPhone = '+27' + phone;
    GlobalState.orgId         = org || 'DEFAULT';

    saveSession();
    bootConsole();
}

function bootConsole() {
    DOM.authScreen.classList.add('hidden');
    DOM.consoleScreen.classList.remove('hidden');

    if (DOM.profileNameLbl) DOM.profileNameLbl.innerText = GlobalState.operatorName || 'OPERATOR';
    if (DOM.profileRoleLbl) DOM.profileRoleLbl.innerText = 'ORG: ' + GlobalState.orgId;
    if (DOM.systemStatusLbl) DOM.systemStatusLbl.innerText = 'SYSTEM: ARMED';

    loadContacts();
    initMap();

    tick("Console armed. Operator: " + GlobalState.operatorName);
    tick("Org ID: " + GlobalState.orgId);
    tick("Line: " + GlobalState.operatorPhone);
    tick("Add your contacts below then press SAVE.");
}

/* ══════════════════════════════════════════
   MODULE 2: CONTACTS
   ══════════════════════════════════════════ */
function saveContacts() {
    GlobalState.routingMatrix.primary   = DOM.inputPrimary   ? DOM.inputPrimary.value.trim()   : '';
    GlobalState.routingMatrix.secondary = DOM.inputSecondary ? DOM.inputSecondary.value.trim() : '';
    GlobalState.routingMatrix.tertiary  = DOM.inputTertiary  ? DOM.inputTertiary.value.trim()  : '';
    GlobalState.routingMatrix.whatsapp  = DOM.inputWhatsapp  ? DOM.inputWhatsapp.value.trim()  : '';
    GlobalState.routingMatrix.police    = DOM.inputPolice    ? DOM.inputPolice.value.trim()    : '';

    localStorage.setItem('sl_contacts', JSON.stringify(GlobalState.routingMatrix));

    tick("Contacts saved:");
    tick("  Primary:   " + (GlobalState.routingMatrix.primary   || 'empty'));
    tick("  Secondary: " + (GlobalState.routingMatrix.secondary || 'empty'));
    tick("  Tertiary:  " + (GlobalState.routingMatrix.tertiary  || 'empty'));
    tick("  WhatsApp:  " + (GlobalState.routingMatrix.whatsapp  || 'empty'));
    tick("  Police:    " + (GlobalState.routingMatrix.police    || 'empty'));
    tick("System fully armed and ready.");

    alert("Contacts saved. System is armed.");
}

function loadContacts() {
    const saved = localStorage.getItem('sl_contacts');
    if (!saved) return;

    GlobalState.routingMatrix = JSON.parse(saved);
    if (DOM.inputPrimary)   DOM.inputPrimary.value   = GlobalState.routingMatrix.primary   || '';
    if (DOM.inputSecondary) DOM.inputSecondary.value = GlobalState.routingMatrix.secondary || '';
    if (DOM.inputTertiary)  DOM.inputTertiary.value  = GlobalState.routingMatrix.tertiary  || '';
    if (DOM.inputWhatsapp)  DOM.inputWhatsapp.value  = GlobalState.routingMatrix.whatsapp  || '';
    if (DOM.inputPolice)    DOM.inputPolice.value    = GlobalState.routingMatrix.police    || '';

    tick("Saved contacts loaded.");
}

/* ══════════════════════════════════════════
   MODULE 3: PANIC HOLD
   ══════════════════════════════════════════ */
function startPanicHold(e) {
    e.preventDefault();
    if (GlobalState.pipelineTriggered) return;

    buzz(150);
    tick("Hold detected. Keep holding 2 seconds...");

    if (DOM.triggerButton) {
        DOM.triggerButton.style.boxShadow = '0 0 40px rgba(239,68,68,0.8)';
        DOM.triggerButton.style.transform = 'scale(0.96)';
    }

    GlobalState.interactionTimer = setTimeout(() => {
        buzz(600);
        firePanicPipeline();
    }, CORE_CONFIG.holdThreshold);
}

function cancelPanicHold() {
    if (GlobalState.pipelineTriggered) return;
    clearTimeout(GlobalState.interactionTimer);

    if (DOM.triggerButton) {
        DOM.triggerButton.style.boxShadow = '';
        DOM.triggerButton.style.transform = '';
    }
}

/* ══════════════════════════════════════════
   MODULE 4: PANIC PIPELINE
   ══════════════════════════════════════════ */
function firePanicPipeline() {
    GlobalState.pipelineTriggered = true;

    if (DOM.triggerButton) {
        DOM.triggerButton.style.boxShadow = '';
        DOM.triggerButton.style.transform = '';
    }

    DOM.countdownOverlay.classList.remove('hidden');
    let remaining = CORE_CONFIG.bufferWindow;
    DOM.countdownText.innerText = remaining;

    tick("ALERT TRIGGERED.");
    tick("Sending SMS to all contacts now...");

    // Get live GPS first then send
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                CORE_CONFIG.defaultLat = pos.coords.latitude;
                CORE_CONFIG.defaultLon = pos.coords.longitude;
                tick("GPS locked: " + pos.coords.latitude.toFixed(5) + ", " + pos.coords.longitude.toFixed(5));
                sendSMS();
            },
            () => {
                tick("GPS unavailable. Using default location.");
                sendSMS();
            },
            { timeout: 5000, enableHighAccuracy: true }
        );
    } else {
        sendSMS();
    }

    GlobalState.countdownTracker = setInterval(() => {
        remaining--;
        DOM.countdownText.innerText = remaining;
        if (remaining <= 0) {
            clearInterval(GlobalState.countdownTracker);
            startCalls();
        }
    }, 1000);
}

function disarmPipeline() {
    clearInterval(GlobalState.countdownTracker);
    clearTimeout(GlobalState.interactionTimer);
    GlobalState.pipelineTriggered = false;
    DOM.countdownOverlay.classList.add('hidden');
    tick("Pipeline DISARMED. No calls will be made.");
    buzz(200);
}

/* ══════════════════════════════════════════
   MODULE 5: SMS
   ══════════════════════════════════════════ */
function sendSMS() {
    const lat = CORE_CONFIG.defaultLat;
    const lon = CORE_CONFIG.defaultLon;
    const gpsLink = "https://maps.google.com/?q=" + lat + "," + lon;
    const msg = "EMERGENCY - " + (GlobalState.operatorName || 'Someone') +
                " needs help immediately. Location: " + gpsLink;

    const numbers = getActiveNumbers();

    if (numbers.length === 0) {
        tick("WARNING: No contacts saved. Go to SAVE TELEPHONY MATRIX and add numbers first.");
        return;
    }

    if (GlobalState.drillModeActive) {
        tick("[DRILL] Would send SMS to: " + numbers.join(', '));
        tick("[DRILL] Message: " + msg);
        return;
    }

    // Try Cordova SMS plugin first
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.sms) {
        numbers.forEach(num => {
            const clean = num.replace(/\s+/g, '');
            cordova.plugins.sms.send(
                clean, msg,
                { replaceLineBreaks: false, android: { intent: '' } },
                () => tick("SMS sent to " + clean),
                (err) => tick("SMS FAILED to " + clean + ": " + err)
            );
        });
        tick("SMS broadcast complete via Cordova plugin.");

    // Try window.sms or window.SMS
    } else if (window.sms || window.SMS) {
        const smsEngine = window.sms || window.SMS;
        numbers.forEach(num => {
            const clean = num.replace(/\s+/g, '');
            smsEngine.send(
                clean, msg,
                { replaceLineBreaks: false, android: { intent: '' } },
                () => tick("SMS sent to " + clean),
                (err) => tick("SMS FAILED to " + clean + ": " + err)
            );
        });

    // Last resort: open SMS app
    } else {
        tick("Cordova SMS plugin not found. Opening SMS app...");
        const joined = numbers.join(';');
        window.location.href = "sms:" + joined + "?body=" + encodeURIComponent(msg);
    }
}

/* ══════════════════════════════════════════
   MODULE 6: CALLS
   ══════════════════════════════════════════ */
function startCalls() {
    DOM.countdownOverlay.classList.add('hidden');
    tick("Countdown complete. Starting sequential calls...");

    const numbers = getActiveNumbers();

    if (numbers.length === 0) {
        tick("No numbers to call. Opening WhatsApp...");
        openWhatsApp();
        return;
    }

    callNext(numbers, 0);
}

function callNext(numbers, index) {
    if (index >= numbers.length) {
        openWhatsApp();
        return;
    }

    const num = numbers[index];
    tick("Calling " + (index + 1) + " of " + numbers.length + ": " + num);

    if (GlobalState.drillModeActive) {
        tick("[DRILL] Would call: " + num);
        setTimeout(() => callNext(numbers, index + 1), 2000);
        return;
    }

    const clean = num.replace(/\s+/g, '');

    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.CallNumber) {
        cordova.plugins.CallNumber.callNumber(
            () => {
                tick("Calling " + clean + " ...");
                setTimeout(() => callNext(numbers, index + 1), 12000);
            },
            (err) => {
                tick("Call failed on " + clean + ": " + err);
                callNext(numbers, index + 1);
            },
            clean, true
        );
    } else if (window.plugins && window.plugins.CallNumber) {
        window.plugins.CallNumber.callNumber(
            () => { setTimeout(() => callNext(numbers, index + 1), 12000); },
            () => { callNext(numbers, index + 1); },
            clean, true
        );
    } else {
        tick("Opening dialer for " + clean + "...");
        window.location.href = "tel:" + clean;
        setTimeout(() => callNext(numbers, index + 1), 8000);
    }
}

/* ══════════════════════════════════════════
   MODULE 7: WHATSAPP
   ══════════════════════════════════════════ */
function openWhatsApp() {
    tick("Opening WhatsApp dispatch...");

    if (GlobalState.drillModeActive) {
        tick("[DRILL] Would open WhatsApp.");
        resetSystem();
        return;
    }

    const waNumber = GlobalState.routingMatrix.whatsapp.replace(/\D/g, '');
    const lat = CORE_CONFIG.defaultLat;
    const lon = CORE_CONFIG.defaultLon;
    const msg = encodeURIComponent(
        "EMERGENCY - " + (GlobalState.operatorName || 'Someone') +
        " needs help! Location: https://maps.google.com/?q=" + lat + "," + lon
    );

    if (waNumber.length > 8) {
        window.open("https://wa.me/" + waNumber + "?text=" + msg, '_system');
    } else {
        window.open("https://wa.me/?text=" + msg, '_system');
    }

    resetSystem();
}

function resetSystem() {
    GlobalState.pipelineTriggered = false;
    DOM.countdownOverlay.classList.add('hidden');
    tick("Alert pipeline complete. System reset and ready.");
}

/* ══════════════════════════════════════════
   MODULE 8: VOLUME KEY BACKUP TRIGGER
   ══════════════════════════════════════════ */
function attachVolumeKeyInterceptor() {
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 24 || e.key === "VolumeUp") {
            GlobalState.volumePressCount++;
            clearTimeout(GlobalState.volumeResetTimer);
            buzz(80);

            tick("Volume up pressed: " + GlobalState.volumePressCount + "/3");

            GlobalState.volumeResetTimer = setTimeout(() => {
                GlobalState.volumePressCount = 0;
            }, 3000);

            if (GlobalState.volumePressCount >= 3) {
                GlobalState.volumePressCount = 0;
                tick("Volume triple-press trigger activated!");
                firePanicPipeline();
            }
        }
    });
}

/* ══════════════════════════════════════════
   MODULE 9: MAP
   ══════════════════════════════════════════ */
function initMap() {
    const mapEl = document.getElementById('gis-radar-viewport');
    if (!mapEl || GlobalState.gisMapEngine) return;

    GlobalState.gisMapEngine = L.map('gis-radar-viewport').setView(
        [CORE_CONFIG.defaultLat, CORE_CONFIG.defaultLon], 13
    );

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(GlobalState.gisMapEngine);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            CORE_CONFIG.defaultLat = lat;
            CORE_CONFIG.defaultLon = lon;
            L.marker([lat, lon])
                .addTo(GlobalState.gisMapEngine)
                .bindPopup("Your location")
                .openPopup();
            GlobalState.gisMapEngine.setView([lat, lon], 14);
            tick("GPS location locked on map.");
        }, () => {
            tick("GPS unavailable. Map showing default area.");
        });
    }
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function getActiveNumbers() {
    return [
        GlobalState.routingMatrix.primary,
        GlobalState.routingMatrix.secondary,
        GlobalState.routingMatrix.tertiary,
        GlobalState.routingMatrix.police
    ].filter(n => n && n.replace(/\s+/g,'').length > 5);
}

function buzz(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

function tick(msg) {
    const time = new Date().toLocaleTimeString();
    if (DOM.statusLog) {
        DOM.statusLog.innerHTML += '<div>[' + time + '] ' + msg + '</div>';
        DOM.statusLog.scrollTop = DOM.statusLog.scrollHeight;
    }
    console.log('[SafetyLink] ' + msg);
}

function logDiagnosticStartup() {
    tick("SafetyLink v3.2 booting...");
    tick("Cordova: "      + (typeof cordova !== 'undefined' ? 'OK' : 'NOT FOUND'));
    tick("SMS Plugin: "   + (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.sms
                              ? 'OK' : window.sms ? 'window.sms OK' : 'NOT FOUND'));
    tick("Call Plugin: "  + (window.plugins && window.plugins.CallNumber
                              ? 'OK' : typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.CallNumber
                              ? 'cordova.plugins OK' : 'NOT FOUND'));
    tick("Geolocation: "  + (navigator.geolocation ? 'OK' : 'NOT FOUND'));
    tick("Vibration: "    + (navigator.vibrate ? 'OK' : 'NOT FOUND'));
    tick("Ready. Enter your name, phone, org code and press INITIALIZE.");
}

/* ══════════════════════════════════════════
   SESSION PERSISTENCE
   ══════════════════════════════════════════ */
function saveSession() {
    localStorage.setItem('sl_name',  GlobalState.operatorName);
    localStorage.setItem('sl_phone', GlobalState.operatorPhone);
    localStorage.setItem('sl_org',   GlobalState.orgId);
}

function loadPersistentState() {
    const name  = localStorage.getItem('sl_name');
    const phone = localStorage.getItem('sl_phone');
    const org   = localStorage.getItem('sl_org');

    if (name && phone) {
        GlobalState.operatorName  = name;
        GlobalState.operatorPhone = phone;
        GlobalState.orgId         = org || 'DEFAULT';
        bootConsole();
    }
}
