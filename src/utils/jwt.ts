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
  // Get expiration time from environment or default to 24 hours
  const getTokenExpirationSeconds = (): number => {
    try {
      // Check if environment variable exists
      const envValue = process.env.REFRESH_TOKEN_EXPIRES_IN;
      
      if (!envValue) {
        console.log('REFRESH_TOKEN_EXPIRES_IN not set, using default 24 hours');
        return 24 * 60 * 60; // 24 hours in seconds
      }
      
      // Try to parse the value as a number
      const parsedValue = Number(envValue);
      
      if (isNaN(parsedValue)) {
        console.warn(`Invalid REFRESH_TOKEN_EXPIRES_IN value: "${envValue}", using default`);
        return 24 * 60 * 60;
      }
      
      console.log(`Using token expiration from env: ${parsedValue} seconds`);
      return parsedValue;
    } catch (error) {
      console.error('Error reading token expiration from env:', error);
      return 24 * 60 * 60; // Default fallback
    }
  };

  // Create JWT payload with dynamic expiration
  const payload: JwtPayload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + getTokenExpirationSeconds(),
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
export const generateRefreshToken = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    type: 'refresh',
  };
  
  // Using string directly for secret to avoid type issues
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "");
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

// Helper function to get expiration time from env variable or default
function getExpirationTime(): number {
  if (!process.env.REFRESH_TOKEN_EXPIRES_IN) {
    // Default to 24 hours (in seconds) if environment variable is not set
    return 24 * 60 * 60;
  }
  
  const parsedValue = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10);
  
  // Check if the parsed value is a valid number
  if (isNaN(parsedValue) || parsedValue <= 0) {
    console.warn(
      `Invalid REFRESH_TOKEN_EXPIRES_IN value: "${process.env.REFRESH_TOKEN_EXPIRES_IN}". ` +
      `Using default expiration time of 24 hours.`
    );
    return 24 * 60 * 60; // Default to 24 hours
  }
  
  return parsedValue;
} 