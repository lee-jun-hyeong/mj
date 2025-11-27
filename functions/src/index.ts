import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Example function
export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.json({ message: 'Hello from Firebase!' });
});

