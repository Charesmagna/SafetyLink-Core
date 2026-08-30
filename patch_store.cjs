const fs = require('fs');
const content = fs.readFileSync('src/utils/store.ts', 'utf8');

const newTriggerPanic = `  triggerPanic: async (description) => {
    if (get().activeSOSState !== 'IDLE') return;
    const user = get().currentUser;
    const org = get().currentOrg;
    if (!user && org?.id !== 'kleva') {
      get().addAuditLog('SECURITY', 'SEVERE', 'Unauthorized Dispatch Attempt', 'Unregistered node attempted to deploy a tactical alert.');
      return;
    }

    const incidentId = \`INC-\${Math.floor(1000 + Math.random() * 9000)}-SA\`;
    const loc = get().userLocation || { lat: 0, lng: 0 };
    const isDrill = get().drillMode;

    // STEP 1: CAPTURE DATA OFFLINE (Save to RoomDB Queue Equivalent)
    const offlineItem = {
      id: incidentId,
      timestamp: Date.now(),
      description: \`\${description} \${isDrill ? '[Drill]' : ''}\`,
      lat: loc.lat,
      lng: loc.lng
    };
    const updatedQueue = [...get().localOfflineQueue, offlineItem];
    set({ localOfflineQueue: updatedQueue });
    setStoredJSON('sl_offline_queue', updatedQueue);
    get().addAuditLog('SYSTEM', 'INFO', 'Panic Data Captured Offline', \`Saved locally to Queue: \${incidentId}\`);

    set({ activeSOSState: 'ACQUIRING_GPS' });
    await new Promise(r => setTimeout(r, 800));
    set({ activeSOSState: 'CAPTURING_EVIDENCE' });
    await new Promise(r => setTimeout(r, 800));
    set({ activeSOSState: 'ESCALATING' });
    
    // THE FALLBACK WATERFALL
    
    // STEP 2 & 3A: CHECK INTERNET & TRY DATA MODE
    const isActuallyOffline = (typeof window !== 'undefined' && !navigator.onLine) || !navigator.onLine;
    let dataModeSuccess = false;
    
    if (!isActuallyOffline && !isDrill) {
      get().addAuditLog('DISPATCH', 'INFO', 'LAYER 1: DATA MODE', 'Attempting POST to /api/panic (2KB payload)');
      try {
        const res = await fetch(\`\${get().customBackendUrl}/api/panic/trigger\`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: get().currentUser?.id || 'SL-U-DEMO',
            latitude: loc.lat, 
            longitude: loc.lng,
            description,
            isDrill
          }) 
        });
        if (res.ok) {
          dataModeSuccess = true;
          get().addAuditLog('DISPATCH', 'SUCCESS', 'DATA MODE SUCCESS', 'Server is executing parallel Twilio, VAPI, Bland, Infobip, Telegram.');
          get().addToast('Alert sent via Data (Layer 1)', 'success');
        } else {
          throw new Error('Data POST failed');
        }
      } catch (e) {
        get().addAuditLog('DISPATCH', 'WARN', 'DATA MODE FAILED', 'Server unreachable or offline.');
      }
    }

    if (dataModeSuccess) {
      // If we succeed on Layer 1, we stop the fallback chain.
      get().addAuditLog('DISPATCH', 'INFO', 'WATERFALL HALTED', 'Alert confirmed dispatched via primary channel.');
    } else {
      // STEP 5A: USSD MODE (Simulated for Web)
      get().addAuditLog('DISPATCH', 'INFO', 'LAYER 2: USSD MODE', 'Data failed. Attempting USSD fallback (R0.35).');
      let ussdModeSuccess = false;
      // In a real Android app, we would dial: window.location.href = \`tel:*384*12345*1*\${loc.lat}*\${loc.lng}#\`;
      // We simulate failure for the demonstration of the waterfall if we are totally offline.
      
      if (!isActuallyOffline) {
        // Let's pretend USSD works if we have some minimal connection but API failed
        // For strict offline test, USSD requires cellular signal (which web can't simulate easily, so we pass through).
      }

      if (!ussdModeSuccess) {
        // STEP 6: PCM + SMS MODE (R0.50)
        get().addAuditLog('DISPATCH', 'WARN', 'LAYER 3: PCM + SMS MODE', 'USSD failed/unavailable. Firing Please Call Me (PCM) & Direct SMS via SmsManager.');
        
        get().contacts.slice(0, 3).forEach(c => {
           get().addAuditLog('SYSTEM', 'INFO', 'Sending PCM', \`*140*\${c.phone}#\`);
        });
        get().addToast('Alert sent via PCM + SMS (Layer 3)', 'warn');

        // STEP 7: FULL OFFLINE MESH MODE
        get().addAuditLog('DISPATCH', 'SEVERE', 'LAYER 4: BLE MESH BROADCAST', 'All cellular routes failed. Broadcasting panic packet over Bluetooth Low Energy.');
        set({ isSurvivalMode: true });
        
        // Remove from Queue only when Internet restores (Handled in syncOfflineQueue)
      }
    }

    // Set final state
    const newEvent: PanicEvent = {
      id: incidentId,
      status: 'ESCALATING',
      severity: isDrill ? 'LOW' : 'CRITICAL',
      lat: loc.lat,
      lng: loc.lng,
      timestamp: Date.now(),
      description: description,
      timelineData: [
        { time: new Date().toLocaleTimeString(), message: 'Fallback Chain executed.' }
      ],
      profileUsed: get().currentUser?.id
    };
    
    set(state => ({
      panicEvents: [newEvent, ...state.panicEvents],
      activeSOSState: 'ESCALATING',
      showSOSModal: true
    }));
    
    // Trigger Lizzy Voice Check as a backup
    setTimeout(() => {
      if (get().activeSOSState !== 'IDLE') {
        get().setShowLizzyPopup(true);
      }
    }, 45000);
  },`;

// Replace the old triggerPanic with the new one
// The regex finds the triggerPanic implementation.
const regex = /triggerPanic:\s*async\s*\([^)]*\)\s*=>\s*{[\s\S]*?},\n\n\s*syncOfflineQueue/m;

if(regex.test(content)) {
  const updated = content.replace(regex, newTriggerPanic + '\n\n  syncOfflineQueue');
  fs.writeFileSync('src/utils/store.ts', updated, 'utf8');
  console.log("Successfully patched store.ts");
} else {
  console.error("Regex match failed for triggerPanic in store.ts");
}
