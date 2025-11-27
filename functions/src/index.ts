import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { processOMR } from './omrProcessor';

// Example function
export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.json({ message: 'Hello from Firebase!' });
});

// OMR 처리 함수 export
export { processOMR };

