import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { prisma } from '@fluxfile/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use production URL, falling back through multiple env vars
const appUrl =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  // Disable the default email verification since magic links handle auth
  // By not providing sendVerificationEmail, no verification emails will be sent
  emailVerification: {
    sendOnSignUp: false,
  },
  user: {
    // Map custom fields from our Prisma schema to be included in the session
    additionalFields: {
      accountTier: {
        type: 'string',
        defaultValue: 'FREE',
        input: false, // Not settable by the user
      },
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false,
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Check if user already has an active session - skip email
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { emailVerified: true },
        });

        // Mark user as verified when they use magic link (since they proved email ownership)
        // This prevents BetterAuth from trying to send a separate verification email
        if (existingUser && !existingUser.emailVerified) {
          await prisma.user.update({
            where: { email },
            data: { emailVerified: true },
          });
        }

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@fluxfile.aspekts.dev',
          to: email,
          subject: 'Sign in to FluxFile',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Sign in to FluxFile</h2>
              <p>Click the link below to sign in to your account. This link expires in 5 minutes.</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none;">
                Sign in to FluxFile
              </a>
              <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
});

export type Session = typeof auth.$Infer.Session;
