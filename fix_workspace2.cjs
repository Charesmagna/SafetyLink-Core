const fs = require('fs');
let wi = fs.readFileSync('src/components/WorkspaceIntegrations.tsx', 'utf8');

wi = wi.replace(/window\.\(google as any\)\.picker/g, 'window.google.picker');

// Now let's cast window to any
wi = wi.replace(/window\.google/g, '(window as any).google');

fs.writeFileSync('src/components/WorkspaceIntegrations.tsx', wi);
