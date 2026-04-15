import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Restaurant: a
    .model({
      name: a.string().required(),
      description: a.string().required(),
      city: a.string().required(),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});