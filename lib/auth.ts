import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import {admin as adminPlugin, emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma/prismaClient";
import { getRedisClient } from "@/lib/redis/redisClient";
import { EmailService } from "./email";
import { ac, admin as adminRole, user, facilityOwner } from "./permissions";


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  user: {
    additionalFields: {
      
      // Contact Information
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      
      // Personal Information
      dateOfBirth: {
        type: "date",
        required: false,
        input: true,
      },
      
      gender: {
        type: "string",
        required: false,
        input: true,
      },
      
      // Location Information
      city: {
        type: "string",
        required: false,
        input: true,
      },
      
      state: {
        type: "string",
        required: false,
        input: true,
      },
      
      country: {
        type: "string",
        required: false,
        defaultValue: "India",
        input: true,
      },
      
      isPhoneVerified: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: true,
      },
    },
  },
  secondaryStorage: (process.env.REDIS_URL
    ? {
        get: async (key: string) => {
          try {
            const redis = await getRedisClient();
            const value = await redis.get(key);
            return value ?? null;
          } catch (e) {
            return null;
          }
        },
        set: async (key: string, value: string, ttl?: number) => {
          try {
            const redis = await getRedisClient();
            if (ttl) await redis.set(key, value, { EX: ttl });
            else await redis.set(key, value);
          } catch (e) {
            // Silently ignore Redis write failures
          }
        },
        delete: async (key: string) => {
          try {
            const redis = await getRedisClient();
            await redis.del(key);
          } catch (e) {
            // Silently ignore Redis delete failures
          }
        },
      } as any
    : undefined),

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        // Send the verification email
        const emailService = EmailService.getInstance();
        await emailService.sendEmailVerification(
          user.email,
          url,
          user.name || "User"
        );
        globalThis?.logger?.info({
          meta: {
            requestId: crypto.randomUUID(),
            userId: user.id,
            email: user.email,
          },
          message: "Email verification sent successfully.",
        });
      } catch (error) {
        globalThis?.logger?.error({
          err: error,
          meta: {
            userId: user.id,
            email: user.email,
          },
          message: "Failed to send email verification.",
        });
        throw error;
      }
    },
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          },
        }
      : {}),
  },

  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin: adminRole,
        user,
        facilityOwner
      }
    }),
    nextCookies(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const g = globalThis as any;
        if (!g.__revo_otps) g.__revo_otps = new Map();
        g.__revo_otps.set(email.toLowerCase().trim(), { otp, type, createdAt: Date.now() });
        console.log(`[AUTH OTP] Code for ${email} (${type}): ${otp}`);
      },
    }),
  ],

  rateLimit: {
    window: 10, // time window in seconds
    max: 5, // max requests in the window
    storage: "database",
    modelName: "rateLimit",
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated),
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
});

export const getCachedSession = async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
};