import axios from 'axios';
import config from '../config';

interface BeehiivSubscriber {
  id: string;
  email: string;
  status: string;
  created: string;
}

/**
 * Verify if an email belongs to a Beehiiv subscriber
 * @param email The email to verify
 * @returns Promise<boolean> True if the email belongs to a subscriber
 */
export const verifyBeehiivSubscriber = async (email: string): Promise<boolean|null|any> => {
  try {
    // Beehiiv API endpoints
    const searchUrl = `https://api.beehiiv.com/v2/publications/${config.beehiiv.publicationId}/subscriptions/by_email/${email}`;

    // Search for the subscriber by email
    const response = await axios.get(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.beehiiv.apiKey}`,
      },
    });
    
    // Only if the subscriber is found, return true.
    if (!response.data.data) {
      return null;
    }

    console.log('response.data.data', response.data.data);

    return {
      subscriber: response.data.data.subscriber,
      success: true,
    }

  } catch (error: any) {
    console.error('Error verifying Beehiiv subscriber:', error.message);
    // In case of API failure, we should fail closed (deny access)
    return null;
  }
}; 