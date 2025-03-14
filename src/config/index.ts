import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  
  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.io',
    apiKey: process.env.SUPERTOKENS_API_KEY,
    websiteDomain: process.env.WEBSITE_DOMAIN || 'http://localhost:3000',
    apiDomain: process.env.API_DOMAIN || 'http://localhost:3001',
    apiBasePath: process.env.API_BASE_PATH || '/auth',
  },
  
  beehiiv: {
    apiKey: process.env.BEEHIIV_API_KEY || '',
    publicationId: process.env.BEEHIIV_PUBLICATION_ID || '',
    debugMagicLinks: process.env.DEBUG_MAGIC_LINKS || false,
  },
  
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  },
};

export default config; 