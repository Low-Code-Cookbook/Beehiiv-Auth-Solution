import { Request, Response } from 'express';
import { generateJwt } from '../utils/jwt';
import { verifyBeehiivSubscriber } from '../utils/beehiiv';

/**
 * Verify a JWT token and refresh if needed
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    // If the user is not authenticated (from middleware)
    if (!req.user) {
      return res.status(401).json({
        valid: false,
        message: 'Invalid or expired token',
      });
    }
    
    // Verify the user is still a Beehiiv subscriber
    const subscriber = await verifyBeehiivSubscriber(req.user.email);
    
    if (!subscriber) {
      return res.status(403).json({
        valid: false,
        actionCode: 'noSubscriber',
        message: 'Subscription required',
      });
    }
    
    const { userId, email } = req.user;
    
    return res.json({
      valid: true,
      subscriber: subscriber || {},
      user: {
        userId,
        email,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      valid: false,
      message: 'Verification failed',
    });
  }
};

/**
 * Refresh an expired JWT token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Get the refresh token from cookies
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }
    
    // If the user is not authenticated (from middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    
    // Verify the user is still a Beehiiv subscriber
    const subscriber = await verifyBeehiivSubscriber(req.user.email);
    
    if (!subscriber) {
      return res.status(403).json({
        success: false,
        actionCode: 'noSubscriber',
        message: 'Subscription required',
      });
    }
    
    // Generate a new JWT
    const newJwt = generateJwt(req.user.userId, req.user.email);
    
    // Return the new JWT
    return res.json({
      success: true,
      token: newJwt,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
    });
  }
};
