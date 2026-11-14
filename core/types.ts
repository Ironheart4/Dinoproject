export interface AuthUser {
  id: string;
  name: string | null;
  role: string;
  email?: string;
}
