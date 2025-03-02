import { Request, Response, NextFunction } from 'express';
import { verifyJwt, verifyRefreshToken } from '../utils/jwt';
import { verifyBeehiivSubscriber } from '../utils/beehiiv';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name?: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  // Add other JWT payload properties here
}

/**
 * Middleware to protect routes by verifying the JWT token
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        // Type the decoded token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        
        // Set user info on request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

/**
 * Middleware to verify the user's subscription status
 */
export const requireSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Verify the user is still a subscriber
    const subscriber = await verifyBeehiivSubscriber(req.user.email);
    
    if (!subscriber) {
      // Revoke the session if the user is no longer a subscriber
      return res.status(403).json({ error: 'Subscription required' });
    }
    
    next();
  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ error: 'Subscription verification failed' });
  }
};

/**
 * Middleware to handle token refresh
 */
export const refreshTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the refresh token from cookies
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return next();
    }
    
    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return next();
    }

    // Set user data on the request object
    req.user = {
      userId: payload.userId,
      email: 'email',
    };
    
    next();
  } catch (error) {
    console.error('Refresh token error:', error);
    next();
  }
}; 