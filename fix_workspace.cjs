const fs = require('fs');
let wi = fs.readFileSync('src/components/WorkspaceIntegrations.tsx', 'utf8');

wi = wi.replace(/window\.gapi/g, '(window as any).gapi');
wi = wi.replace(/google\.picker/g, '(google as any).picker');

fs.writeFileSync('src/components/WorkspaceIntegrations.tsx', wi);
