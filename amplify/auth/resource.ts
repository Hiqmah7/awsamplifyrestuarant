import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,           // Users sign in with email + password
  },

  userAttributes: {
    preferredUsername: {
      mutable: true,       // Can be changed later
      required: false,     // Not mandatory during sign-up
    },
  },

  // Optional: You can add more attributes if needed later
  // givenName: { mutable: true, required: false },
  // familyName: { mutable: true, required: false },
});