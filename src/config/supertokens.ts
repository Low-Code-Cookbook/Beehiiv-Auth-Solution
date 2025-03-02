import SuperTokens from "supertokens-node";
import Passwordless from "supertokens-node/recipe/passwordless";
import Dashboard from "supertokens-node/recipe/dashboard";
import config from './index';
import { verifyBeehiivSubscriber } from '../utils/beehiiv';
const { sendMagicLinkEmail } = require("../services/emailService");

export const initSupertokens = () => {
  SuperTokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: config.supertokens.connectionURI,
      apiKey: config.supertokens.apiKey,
    },
    appInfo: {
      appName: 'Beehiiv Auth',
      apiDomain: config.supertokens.apiDomain,
      websiteDomain: config.supertokens.websiteDomain,
      apiBasePath: config.supertokens.apiBasePath,
      websiteBasePath: '/auth',
    },
    recipeList: [
      Passwordless.init({
        contactMethod: 'EMAIL',
        flowType: 'MAGIC_LINK',
        emailDelivery: {
          override: (originalImplementation) => {
            return {
              ...originalImplementation,
              sendEmail: async (input) => {
                console.log('Sending email:', input);

                await sendMagicLinkEmail(input.email, input.urlWithLinkCode);

                // // Before sending magic link, check if the email is a Beehiiv subscriber
                const subscriber = await verifyBeehiivSubscriber(input.email);
                
                if (!subscriber) {
                  // If not a subscriber, throw an error
                  throw new Error('Email is not a Beehiiv subscriber');
                }
                
                // // If subscriber, send the magic link email
                return originalImplementation.sendEmail(input);
              },
            };
          },
        },
      }),
      Dashboard.init({
        apiKey: "supertokens_is_awesome", // Change this in production
      }),
    ],
  });
};

export default {
  passwordless: Passwordless
}; 