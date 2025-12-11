import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';
import type { UserRole } from '@prisma/client';

// Extend the built-in types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      clientId: string | null;
      avatarUrl: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    clientId: string | null;
    avatarUrl: string | null;
  }
}

// Extended JWT type
interface ExtendedJWT {
  id?: string;
  role?: UserRole;
  clientId?: string | null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Required for Amplify/proxied environments
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, check if user exists in our database
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // User not invited - reject sign in
          return false;
        }

        // Update last login and avatar if needed
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            lastLoginAt: new Date(),
            avatarUrl: user.image || existingUser.avatarUrl,
            emailVerified: true,
          },
        });

        // Pass existing user data to JWT
        user.id = existingUser.id;
        user.role = existingUser.role;
        user.clientId = existingUser.clientId;
        user.avatarUrl = existingUser.avatarUrl;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        (token as ExtendedJWT).id = user.id;
        (token as ExtendedJWT).role = user.role;
        (token as ExtendedJWT).clientId = user.clientId;
      }
      return token;
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      if (extendedToken.id) {
        session.user.id = extendedToken.id;
        session.user.role = extendedToken.role!;
        session.user.clientId = extendedToken.clientId ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
