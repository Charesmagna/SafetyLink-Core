const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

const target = `        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['motion'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          'vendor-zustand': ['zustand'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'vendor-capacitor': ['@capacitor/core', '@capacitor/app', '@capacitor/geolocation', '@capacitor/haptics']
        },`;

const replacement = `        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('motion')) return 'vendor-motion';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
            if (id.includes('zustand')) return 'vendor-zustand';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@capacitor')) return 'vendor-capacitor';
            return 'vendor';
          }
        },`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('vite.config.ts', content);
  console.log("vite.config.ts patched successfully");
} else {
  console.log("Target not found in vite.config.ts");
}
