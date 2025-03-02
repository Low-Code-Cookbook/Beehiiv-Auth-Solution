import jwt from 'jsonwebtoken';
import config from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface RefreshPayload {
  userId: string;
  sessionId: string;
  type: string;
}

/**
 * Generate a JWT token for a user
 * @param userId User ID from SuperTokens
 * @param email User email
 * @returns The generated JWT token
 */
export const generateJwt = (userId: string, email: string): string => {

  const payload: JwtPayload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
  };
  
  // Using string directly for secret to avoid type issues
  return jwt.sign(payload, process.env.JWT_SECRET || "");
};

/**
 * Generate a refresh token for a user
 * @param userId User ID from SuperTokens
 * @param sessionId SuperTokens session ID
 * @returns The generated refresh token
 */
export const generateRefreshToken = (userId: string, sessionId: string): string => {
  const payload = {
    userId,
    sessionId,
    type: 'refresh',
  };
  
  // Using string directly for secret to avoid type issues
  return jwt.sign(payload, config.jwt.secret);
};

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return payload;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
};

/**
 * Verify a refresh token
 * @param token Refresh token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export const verifyRefreshToken = (token: string): { userId: string; sessionId: string } | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as RefreshPayload;
    
    // Ensure it's actually a refresh token
    if (payload.type !== 'refresh') {
      return null;
    }
    
    return {
      userId: payload.userId,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
}; 