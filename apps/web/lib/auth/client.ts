import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    magicLinkClient(),
    inferAdditionalFields({
      user: {
        accountTier: {
          type: 'string',
        },
        role: {
          type: 'string',
        },
      },
    }),
  ],
});

export const { signIn, signOut, useSession, getSession } = authClient;
