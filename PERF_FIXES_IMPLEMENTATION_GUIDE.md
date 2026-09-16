/**
 * IMPLEMENTATION GUIDE - Performance Fixes for SafetyLink Core
 * 
 * All 9 critical performance issues have been addressed with targeted patches.
 * This guide explains how to integrate each fix into your codebase.
 */

## Issue #1: Firestore Listener Memory Leak
**File:** src/utils/store.ts
**Fix:** src/utils/store-performance.patch.ts

ACTION ITEMS:
1. Replace getStoredJSON and setStoredJSON functions with cached versions
2. Update initMeshSync() to properly manage subscription lifecycle
3. Add cleanup to logout() to unsubscribe from Firestore listeners
4. Add JSON diffing before set() to prevent unnecessary re-renders

BEFORE:
  useEffect(
    onSnapshot(q, (snapshot) => {
      set({ meshNodes: [...localNodes, ...nodes] });
    })
  )

AFTER:
  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (JSON.stringify(newMeshNodes) !== JSON.stringify(currentState.meshNodes)) {
      set({ meshNodes: newMeshNodes });
    }
  })
  return () => unsubscribe()

---

## Issue #2: Satellite Telemetry Poll Without Backoff
**File:** src/components/OfflineMap.tsx
**Fix:** src/hooks/useSatelliteTelemetry.ts

ACTION ITEMS:
1. Create useSatelliteTelemetry.ts with exponential backoff logic
2. Import and use in OfflineMap component
3. Remove original fetchLiveSatelliteTelemetry and its useEffect
4. Add AbortController for request cancellation on unmount

BEFORE:
  useEffect(() => {
    setInterval(fetchLiveSatelliteTelemetry, 5000); // Every 5s forever
  }, [])

AFTER:
  const { satelliteData, isLoadingSat, satError } = useSatelliteTelemetry()
  // Auto-manages backoff, cleanup, and cancellation

---

## Issue #3: localStorage Parse on Every Access
**File:** src/utils/store.ts
**Fix:** src/utils/store-performance.patch.ts

ACTION ITEMS:
1. Add storageCacheMap = new Map() at top of file
2. Update getStoredJSON to check cache before parsing
3. Update setStoredJSON to update cache after write
4. Clear cache entries when user logs out

BEFORE:
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback; // Parse every time!

AFTER:
  if (storageCacheMap.has(key)) return storageCacheMap.get(key);
  const result = item ? JSON.parse(item) : fallback;
  storageCacheMap.set(key, result); // Cache it
  return result;

---

## Issue #4: Mesh Node Array Reconstruction
**File:** src/utils/store.ts
**Fix:** src/utils/store-performance.patch.ts

ACTION ITEMS:
1. Implement JSON.stringify() diffing before set()
2. Only call set() if array content actually changed
3. Consider using a more efficient diffing library (e.g., immer) for large arrays

BEFORE:
  set({ meshNodes: [...localNodes, ...nodes] }); // Every update!

AFTER:
  if (JSON.stringify(newMeshNodes) !== JSON.stringify(currentState.meshNodes)) {
    set({ meshNodes: newMeshNodes });
  }

---

## Issue #5: Carousel Animation Without Visibility Check
**File:** src/App.tsx
**Fix:** src/components/CarouselWithVisibility.tsx

ACTION ITEMS:
1. Create CarouselWithVisibility component with IntersectionObserver
2. Replace drawer carousel with new component
3. Update App.tsx to import and use new carousel
4. Remove old carousel animation useEffect

BEFORE:
  useEffect(() => {
    if (!isDrawerOpen) return;
    setInterval(() => setCurrentSlideIndex(...), 4500);
  }, [isDrawerOpen])

AFTER:
  <CarouselWithVisibility slides={backgroundSlides} interval={4500} />
  // Auto-pauses when off-screen via IntersectionObserver

---

## Issue #6: PBKDF2 Encryption on Main Thread
**Files:** 
  - Create: src/workers/cryptoWorker.ts
  - Create: src/utils/cryptoAsync.ts
**Fix:** Both files provided

ACTION ITEMS:
1. Create cryptoWorker.ts to handle all crypto off main thread
2. Create cryptoAsync.ts as promise-based wrapper
3. Update src/utils/store.ts setVaultPassword to use derivePasswordVerifierAsync()
4. Update any encryption/decryption calls to use Async versions
5. Add terminateCryptoWorker() to logout cleanup

BEFORE:
  const hash = await derivePasswordVerifier(password); // Blocks UI!

AFTER:
  const hash = await derivePasswordVerifierAsync(password); // Non-blocking

---

## Issue #7: Multiple Geolocation Polls
**File:** Create src/services/GeolocationCacheService.ts
**Fix:** src/services/GeolocationCacheService.ts

ACTION ITEMS:
1. Create GeolocationCacheService singleton
2. Replace all navigator.geolocation calls with service.getLocation()
3. Update components to use subscribe() instead of polling independently
4. Add geolocationService.destroy() to app cleanup

BEFORE:
  // In multiple components:
  navigator.geolocation.watchPosition(...)
  navigator.geolocation.getCurrentPosition(...)

AFTER:
  // Single coordinated service:
  const unsubscribe = geolocationService.subscribe((loc) => {
    updateLocation(loc.lat, loc.lng, loc.accuracy)
  })
  return () => unsubscribe()

---

## Issue #8: Uncancellable Network Requests
**File:** Create src/utils/fetchUtils.ts
**Fix:** src/utils/fetchUtils.ts

ACTION ITEMS:
1. Create fetchUtils.ts with fetchWithTimeout() and makeCancellableFetch()
2. Replace all fetch() calls with fetchWithTimeout() (default 10s timeout)
3. Use makeCancellableFetch() for long-running requests that might need cancellation
4. Update TwilioService, LizzyAIProvider, and other services

BEFORE:
  const r = await fetch(url); // Can hang forever!

AFTER:
  const r = await fetchWithTimeout(url, { timeout: 10000 }); // Auto timeout

---

## Issue #9: BLE Scan Leak on Error
**File:** Create src/services/BleServiceImproved.ts
**Fix:** src/services/BleServiceImproved.ts

ACTION ITEMS:
1. Create BleServiceImproved.ts with state machine
2. Replace BleService imports with BleServiceImproved in src/utils/store.ts
3. Ensure scanForNearbyDevices() calls stopScan() before new scan
4. Add bleService.destroy() to app cleanup/logout

BEFORE:
  // Scan might leak if error occurs
  await BleClient.requestLEScan(...)
  setTimeout(() => stopLEScan(), timeout)

AFTER:
  // Guaranteed cleanup via state machine
  setState('scanning')
  try {
    await BleClient.requestLEScan(...)
  } catch (e) {
    await guaranteedStop()
    throw e
  }

---

## Integration Checklist

□ Fix #1: Update store.ts with listener cleanup & caching
□ Fix #2: Create useSatelliteTelemetry hook and integrate
□ Fix #3: Add localStorage cache to store.ts
□ Fix #4: Add mesh node diffing to store.ts
□ Fix #5: Create CarouselWithVisibility and integrate in App.tsx
□ Fix #6a: Create cryptoWorker.ts
□ Fix #6b: Create cryptoAsync.ts
□ Fix #6c: Update store.ts to use async crypto
□ Fix #7: Create GeolocationCacheService and integrate
□ Fix #8: Create fetchUtils.ts and update network calls
□ Fix #9: Create BleServiceImproved.ts and integrate

## Testing & Verification

1. Memory: Use Chrome DevTools > Memory profiler
   - Check that Firestore listeners are GC'd on logout
   - Verify localStorage cache size is bounded

2. Network: Use DevTools > Network tab
   - Verify satellite API only retries with backoff
   - Check that orphaned requests are cancelled

3. Performance: Use Lighthouse & Performance tab
   - Measure FPS improvement with carousel visibility check
   - Monitor task duration during encryption (should show Web Worker usage)

4. Battery: Use Android Profiler / iOS Instruments
   - Location polling should drain less battery with caching
   - BLE scanning should terminate cleanly

---

## Deployment Priority

HIGH PRIORITY (do first):
  #1 Firestore listener fix
  #8 Fetch timeout wrapper

MEDIUM PRIORITY (do second):
  #2 Satellite backoff
  #3 localStorage cache
  #4 Mesh node diffing
  #7 Geolocation service

LOW PRIORITY (do last):
  #5 Carousel visibility
  #6 Crypto worker (if UI freezes observed)
  #9 BLE scan state machine
