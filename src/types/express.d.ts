import { Express } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                // Add any other properties you need in the user object
            };
        }
    }
} 