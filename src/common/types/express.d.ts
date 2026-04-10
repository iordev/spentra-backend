declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};
