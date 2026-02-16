import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@fluxfile/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@fluxfile.aspekts.dev',
        to: user.email,
        subject: 'Reset your FluxFile password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Click the link below to reset your FluxFile password:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none;">
              Reset Password
            </a>
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@fluxfile.aspekts.dev',
        to: user.email,
        subject: 'Verify your FluxFile email',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to FluxFile!</h2>
            <p>Please verify your email address to get started:</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none;">
              Verify Email
            </a>
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              If you didn't create a FluxFile account, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
});

export type Session = typeof auth.$Infer.Session;
