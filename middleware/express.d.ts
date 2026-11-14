declare global {
  namespace Express {
    interface User {
      id: string;
      name: string | null;
      role: string;
      email?: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export {};