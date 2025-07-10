import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getCsrfToken } from 'next-auth/react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { parseSiweMessage, validateSiweMessage, type SiweMessage } from 'viem/siwe';
import { DatabaseService } from '@/lib/supabase/database-service';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Create a public client for signature verification
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder: '0x0',
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder: '0x0',
        },
      },
      async authorize(credentials, req) {
        try {
          console.log('SIWE Auth attempt:', { 
            hasMessage: !!credentials?.message, 
            hasSignature: !!credentials?.signature 
          });

          if (!credentials?.message || !credentials?.signature) {
            console.log('Missing credentials');
            return null;
          }

          // Parse the SIWE message
          const siweMessage = parseSiweMessage(credentials.message) as SiweMessage;
          console.log('Parsed SIWE message:', {
            address: siweMessage?.address,
            domain: siweMessage?.domain,
            uri: siweMessage?.uri,
            nonce: siweMessage?.nonce,
          });

          // Validate the message structure
          if (!validateSiweMessage({
            address: siweMessage?.address,
            message: siweMessage,
          })) {
            console.log('Invalid SIWE message structure');
            return null;
          }

          // Get the expected nonce from the session
          const nonce = await getCsrfToken({ req: { headers: req.headers } });
          console.log('Nonce comparison:', { 
            messageNonce: siweMessage.nonce, 
            sessionNonce: nonce 
          });
          
          // Verify the nonce matches
          if (siweMessage.nonce !== nonce) {
            console.log('Nonce mismatch');
            return null;
          }

          // Verify the signature
          console.log('Verifying signature...');
          const valid = await publicClient.verifyMessage({
            address: siweMessage.address,
            message: credentials.message,
            signature: credentials.signature as `0x${string}`,
          });

          console.log('Signature verification result:', valid);

          if (!valid) {
            console.log('Invalid signature');
            return null;
          }

          // Process wallet address for authentication
          const walletAddress = siweMessage.address.toLowerCase();
          console.log('Processing wallet address:', walletAddress);
          
          // Check if user exists with this wallet address
          const existingUser = await DatabaseService.getWalletUser(walletAddress);
          
          if (existingUser.success && existingUser.data) {
            // User exists, return their info for sign-in
            console.log('Existing user found, signing in:', existingUser.data.user_id);
            return {
              id: existingUser.data.user_id,
              name: existingUser.data.name || walletAddress,
              email: walletAddress, // Use wallet address as email for NextAuth compatibility
              image: null,
            };
          } else {
            // User doesn't exist - this should only happen during sign-up flow
            // For sign-in attempts with non-existent users, return null
            console.log('No existing user found for wallet address:', walletAddress);
            console.log('If this is a sign-up attempt, the user should be created via the sign-up flow');
            return null;
          }

          return null;
        } catch (error) {
          console.error('SIWE auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata);
      }
    },
  },
};

export default NextAuth(authOptions); 