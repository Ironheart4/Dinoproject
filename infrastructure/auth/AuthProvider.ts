export interface AuthSignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthSignUpResult {
  userId: string;
  email: string | undefined;
}

export interface AuthSignInResult {
  userId: string;
  email: string | undefined;
  nameFromMetadata: string | undefined;
  accessToken: string;
  refreshToken: string;
}

export interface AuthRefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserInfo {
  id: string;
  email?: string;
  name?: string;
}

export interface AuthProvider {
  signUp(input: AuthSignUpInput): Promise<AuthSignUpResult>;
  signIn(email: string, password: string): Promise<AuthSignInResult>;
  signOut(): Promise<void>;
  refresh(refreshToken: string): Promise<AuthRefreshResult>;
  getUser(accessToken: string): Promise<AuthUserInfo | null>;
}
