import express, { RequestHandler } from 'express';
import { middleware } from 'supertokens-node/framework/express';
import { verifyToken, refreshToken } from '../controllers/auth';
import { requireAuth, refreshTokenMiddleware } from '../middleware/auth';
import Passwordless from 'supertokens-node/recipe/passwordless';
import { generateJwt, generateRefreshToken } from '../utils/jwt';
import { verifyBeehiivSubscriber } from '../utils/beehiiv';
import config from '../config';
import { sendMagicLinkEmail } from '../services/emailService';

const router = express.Router();

// SuperTokens middleware for all auth routes
router.use(middleware());

const whitelistDomainsStr = process.env.WHITELIST_DOMAINS || 'lowcodecto.com,*.lowcodecto.com,localhost:4000';
const allowedDomains = whitelistDomainsStr.split(',').map(domain => domain.trim());

function isAllowedDomain(hostname, allowedDomains) {
  return allowedDomains.some(domain => {
    // Exact match
    if (hostname === domain) return true;
    
    // Wildcard match
    if (domain.startsWith('*.')) {
      const suffix = domain.substring(1); // Remove the *
      return hostname.endsWith(suffix);
    }
    
    return false;
  });
}

// Route for initiating the magic link flow
router.post('/login', (async (req, res, next) => {
  try {
    const { email } = req.body;
    let { redirectUrl } = req.body;

    if (!redirectUrl) {
      redirectUrl = `${process.env.API_DOMAIN}/verify-token`
    } else {
      // Safe list of domains allows for custom redirect URLs
      // Allow for wildcard subdomains

      const url = new URL(redirectUrl);
      if (!isAllowedDomain(url.hostname, allowedDomains)) {
        return res.status(400).json({ 
          success: false, 
          actionCode: 'invalidRedirectUrl',
          message: 'Invalid redirect URL. The domain is not in the whitelist.'
        });
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        actionCode: 'emailRequired',
        message: 'Email is required'
      });
    }

    // Verify the user is still a subscriber
    console.log('Prompt Email', email);
    const subscriber = await verifyBeehiivSubscriber(email);

    if (!subscriber) {
      // Revoke the session if the user is no longer a subscriber
      return res.status(400).json({ 
        success: false, 
        message: 'You are not subscribed to the Low Code CTO newsletter.' 
      });
    } else {
      console.log('Heree subscriber:', subscriber);
      if (subscriber.status !== 'active') {
        return res.status(400).json({ 
          success: false, 
          actionCode: 'inactiveSubscriber',
          message: 'You are not an active subscriber to the Low Code CTO newsletter.' 
        });
      }
    }

    // Create the magic link using SuperTokens
    const response = await Passwordless.createCode({
      tenantId: "public",
      email,
      userInputCode: undefined
    });

    // Construct the magic link URL// This should match your SuperTokens config
    const { preAuthSessionId, linkCode } = response;

    // Construct the full URL that the user will click on
    const magicLink = `${redirectUrl}?preAuthSessionId=${preAuthSessionId}&linkCode=${linkCode}&rid=passwordless`;

    // Send the email manually if needed
    await sendMagicLinkEmail(email, magicLink);

    return res.json({
      success: true,
      magicLink: magicLink,
      actionCode: 'magicLinkSent',
      message: "Magic link sent successfully"
    });
  } catch (error: any) {
    // Check if this is the Beehiiv subscription error
    if (error.message && error.message.includes('not a Beehiiv subscriber')) {
      return res.status(403).json({
        success: false,
        actionCode: 'emailNotSubscribed',
        message: 'Email is not registered as a Low Code CTO subscriber.'
      });
    }

    next(error);
  }
}) as RequestHandler);

// Route for verifying the magic link code
router.post('/callback', (async (req, res, next) => {
  try {
    const { preAuthSessionId, linkCode } = req.body;

    if (!preAuthSessionId || !linkCode) {
      return res.status(400).json({
        success: false,
        actionCode: 'emailNotSubscribed',
        message: 'Missing required parameters'
      });
    }

    // Verify the code using SuperTokens
    // @ts-ignore
    const response = await Passwordless.consumeCode({
      tenantId: "public",
      preAuthSessionId,
      linkCode,
    });

    if (response.status === "OK") {
      
      // Get user information
      const userId = response.user.id;
      const email = response.user.emails[0]; // Assuming the first email is the primary one

      // Generate JWT token directly without SuperTokens session
      const jwt = generateJwt(userId, email);
      const refreshToken = generateRefreshToken(userId, email);

      // Store refresh token in HTTP-only cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
         // @ts-ignore
        sameSite: 'Strict',
        path: '/auth/refresh', // Restrict usage to refresh endpoint
      });
      
      // Return the token
      return res.json({
        success: true,
        token: jwt,
        user: {
          userId,
          email
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        actionCode: 'invalidOrExpiredCode',
        message: 'Invalid or expired code'
      });
    }
  } catch (error: any) {
    console.error('Verify magic link error:', error);
    next(error);
  }
}) as RequestHandler);

// Verify token and check subscription status
// @ts-ignore
router.get('/verify', requireAuth, (async (req, res, next) => {
  try {
    await verifyToken(req, res);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Refresh expired JWT tokens
router.post('/refresh', refreshTokenMiddleware, (async (req, res, next) => {
  try {
    await refreshToken(req, res);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router; 