const fs = require('fs');

let rd = fs.readFileSync('src/components/ResponderDashboard.tsx', 'utf8');

rd = rd.replace(
  "if (activeSOSState?.initiatorId === u.id && activeSOSState.isActive) return 'panic';",
  "// Check if there is an active panic event for this user\n    const isPanic = useAppStore.getState().panicEvents.some(e => e.profileUsed === u.id && e.status !== 'RESOLVED');\n    if (isPanic) return 'panic';"
);

rd = rd.replace(
  "if (!u.lastLocation) return 'offline';",
  "if (!(u as any).lastLocation) return 'offline';"
);

rd = rd.replace(
  "const age = Date.now() - ((u.lastLocation as any).timestamp || 0);",
  "const age = Date.now() - (((u as any).lastLocation as any).timestamp || 0);"
);

fs.writeFileSync('src/components/ResponderDashboard.tsx', rd);
