import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**', 'android/**', 'node_modules/**', 'worker/**', '.gmp_cache/**']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
