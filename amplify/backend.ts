import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Define the Amplify backend
 * This is the main entry point for your Amplify Gen 2 backend
 */
defineBackend({
  auth,
  data,
});