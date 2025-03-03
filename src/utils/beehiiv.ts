import axios from 'axios';
import config from '../config';

interface BeehiivSubscriber {
  id: string;
  email: string;
  status: string;
  created: string;
  customFields: any;
}

interface CustomField {
  name: string;
  kind: string;
  value: any;
}

export const transformCustomFields = (customFields: CustomField[]): Record<string, any> => {
  return customFields.reduce((acc, field) => {
    acc[field.name] = field.value;
    return acc;
  }, {} as Record<string, any>);
};

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
      params: {
        expand: ['custom_fields'],
      },
    });
    
    // Only if the subscriber is found, return true.
    if (!response.data.data) {
      return null;
    }

    const subscriberData: any = {
      status: response.data.data.status,
      email: response.data.data.email || email,
      subscription_tier: response.data.data.subscription_tier,
      id: response.data.data.id,
      created: response.data.data.created,
      customFields: transformCustomFields(response.data.data.custom_fields || []),
    };

    console.log('Subscriber Data', subscriberData);

    return subscriberData;
  } catch (error: any) {
    console.error('Error verifying Beehiiv subscriber:', error.message);
    // In case of API failure, we should fail closed (deny access)
    return null;
  }
}; 
