import express, { RequestHandler } from 'express';
import { middleware } from 'supertokens-node/framework/express';
import { verifyToken, refreshToken } from '../controllers/auth';
import { requireAuth, refreshTokenMiddleware } from '../middleware/auth';
import Passwordless from 'supertokens-node/recipe/passwordless';
import { generateJwt } from '../utils/jwt';
import config from '../config';
import { sendMagicLinkEmail } from '../services/emailService';

const router = express.Router();

// SuperTokens middleware for all auth routes
router.use(middleware());

// Route for initiating the magic link flow
router.post('/login', (async (req, res, next) => {
  try {
    const { email } = req.body;
    let { redirectUrl } = req.body;

    if (!redirectUrl) {
      redirectUrl = `${process.env.API_DOMAIN}/verify-token`
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Create the magic link using SuperTokens
    const response = await Passwordless.createCode({
      tenantId: "public",
      email,
      userInputCode: undefined
    });

    // Construct the magic link URL
    const websiteDomain = config.supertokens.websiteDomain;
    const websiteBasePath = '/auth'; // This should match your SuperTokens config
    const { preAuthSessionId, linkCode } = response;

    // Construct the full URL that the user will click on
    const magicLink = `${redirectUrl}?preAuthSessionId=${preAuthSessionId}&linkCode=${linkCode}&rid=passwordless`;

    // Send the email manually if needed
    await sendMagicLinkEmail(email, magicLink);

    return res.json({
      success: true,
      magicLink: magicLink,
      message: "Magic link sent successfully"
    });
  } catch (error: any) {
    // Check if this is the Beehiiv subscription error
    if (error.message && error.message.includes('not a Beehiiv subscriber')) {
      return res.status(403).json({
        success: false,
        message: 'Email is not registered as a Beehiiv subscriber'
      });
    }

    next(error);
  }
}) as RequestHandler);

// Route for verifying the magic link code
router.get('/callback', (async (req, res, next) => {
  try {
    const { preAuthSessionId, linkCode } = req.query;

    if (!preAuthSessionId || !linkCode) {
      return res.status(400).json({
        success: false,
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
    console.log('verify');
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