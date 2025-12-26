import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log('Auth config - Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('Auth config - Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('Auth config - NextAuth Secret exists:', !!process.env.NEXTAUTH_SECRET);

const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            console.log("SignIn callback - User:", user);
            console.log("SignIn callback - Account:", account);
            console.log("SignIn callback - Profile:", profile);
            return true;
        },
        async session({ session, token, user }) {
            // Add user ID and role to session from database user
            if (session.user && user) {
                session.user.id = user.id;
                session.user.role = user.role || 'author'; // Default to author if no role
            }
            return session;
        },
        // async redirect({ url, baseUrl }) {
        //     // Commented out to prevent conflicts with custom authentication
        //     // Only redirect to /entry after successful sign-in, not on every access
        //     if (url.includes('/api/auth/signin') || url === baseUrl) {
        //         return `${baseUrl}/entry`;
        //     }
        //     // If there's a callbackUrl, honor it
        //     if (url.startsWith(baseUrl)) {
        //         return url;
        //     }
        //     // Allows relative callback URLs
        //     if (url.startsWith("/")) {
        //         return `${baseUrl}${url}`;
        //     }
        //     return baseUrl;
        // },
    },
    pages: {
        signIn: '/',
    },
    events: {
        async signIn({ user, account, profile, isNewUser }) {
            console.log("SignIn event - User:", user?.email, "Is new user:", isNewUser);
        },
        async signOut({ session, token }) {
            console.log("SignOut event");
        },
        async createUser({ user }) {
            console.log("Create user event:", user?.email);
        },
    },
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,
    // Let NextAuth auto-detect the URL from request headers
    // This works better than hardcoding ports
    trustHost: true,
};

export default NextAuth(authOptions);
export { authOptions }; 