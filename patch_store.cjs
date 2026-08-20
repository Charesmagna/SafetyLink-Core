const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

if (!code.includes('globalTheme')) {
  // Add to AppState interface
  code = code.replace(
    /interface AppState \{/,
    `interface AppState {\n  globalTheme: 'dark' | 'light';\n  setGlobalTheme: (theme: 'dark' | 'light') => void;`
  );

  // Add to store implementation
  code = code.replace(
    /export const useAppStore = create<AppState>\(\)\(persist\(\(set, get\) => \(\{/,
    `export const useAppStore = create<AppState>()(persist((set, get) => ({\n  globalTheme: 'dark',\n  setGlobalTheme: (theme) => set({ globalTheme: theme }),`
  );

  fs.writeFileSync('src/utils/store.ts', code);
  console.log('Patched store.ts');
}
