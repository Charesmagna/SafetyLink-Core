// FirebaseAuthService — stubbed out, auth handled by /api/login
export const firebaseLogin = async (_username: string, _password: string) => {
  throw new Error('Use /api/login instead');
};
export const firebaseRegisterUser = async (..._args: any[]) => {
  throw new Error('Use /api/register instead');
};
