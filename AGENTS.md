# SafetyLink Development Environment Persistent Memory (AGENTS.md)

This document serves as the persistent memory layer and standard of architectural practice for the SafetyLink core platform. It establishes the design systems, scope parameters, and behavioral guidelines for any agents or systems operating on this codebase.

---

## 1. System Vision & Purpose
SafetyLink is a unified, highly optimized **Sequential Emergency Alert Network** designed to function seamlessly under restrictive offline, hardware-constrained, or distress scenarios. 

While initially contextualized around campus safety and housing complexes, the architecture has been fully generalized to support diverse safety-mesh node types, including:
- **Security Companies & Patrol Agencies**: Dispatch networks, real-time alert logs, guard telemetry, and command centers.
- **Schools & Universities**: Student safety rosters, panic alert binding, campus patrol links, and parental/administrator alert escalation.
- **Corporate Offices & Manufacturing Sites**: Employee safe-zones, muster-point verification, lone-worker safety check-ins, and floor-marshal command screens.
- **Government Organizations & Public Utilities**: Community alert loops, regional security response nodes, and municipal responder routing.
- **Individuals & Families**: Independent personal security triggers, family geo-fence circles, and private escalation contacts.

---

## 2. Core Architecture Rules

### State Management & Single Source of Truth
- **Storage Node**: `/src/utils/store.ts` contains the absolute representation of user records, active panic events, configured contacts, and system options.
- **Dynamic Simulation**: Simulated Bluetooth Low Energy (BLE) beacons, and simulated background location telemetry, feed directly into this state to replicate real physical hardware behaviors safely.

### Role-Based Access Routing
1. **Super Admin Profile (`SL-admin-0000`)**: Opens the master **SL Global Command Center**, with top-tier audit logs, master user control, database-wide organization lookup, and distress signals feeds.
2. **Organization / Entity Profile (`SL-ORG-XXXX`)**: Opens the **Safety Node Commander Deck** specific to that bound node (e.g. Security Company, School, Corporate Office, or Gov Node).
3. **End User / Responder Profile**: Opens the **Safety Hub Workspace**, exposing the big central panic trigger, BLE beacon scanner, local offline GIS Map, and personalized emergency contact chain.

---

## 3. Environment Constraints & Guidelines
- **Jetpack Compose / React Harmony**: While the core app provides a responsive, web-based high-fidelity simulator representing Material Design 3, the Android Gradle bundle relies on standard Java/Kotlin backings for background location polling (`SafetyBackgroundService.kt`) and notification triggers.
- **Strict Lint Compliance**: Ensure zero unused variables, correct typescript bindings, and no conflicting interfaces.
- **No Mock-Only Interfaces**: Always keep active live simulations responsive (e.g., coordinates change, timelines update, BLE beacons scan and emit genuine UUIDs).

---

## 4. UI Naming & Testability Conventions
- **Test Tags**: Keep primary visual elements labeled with unique tags for automation scripts.
- **Visual Palette**: Utilize deep space colors (Slate 950 base) with high-contrast indicator status lights (Emerald 400 for armed, Red 500 for emergency distress, Amber 400 for GIS coordinates).

---

**Generated on: 2026-06-29T16:15:00-07:00**
*SafetyLink Project Core Team & DeepMind Secure Gateway Integrations.*
