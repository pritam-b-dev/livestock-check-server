import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { connectDB } from "./db";

const client = process.env.MONGODB_URI;
if (!client) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}

export const auth = betterAuth({
  database: mongodbAdapter(async () => {
    const db = await connectDB();
    return db;
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      plan: {
        type: "string",
        defaultValue: "free",
        required: false,
      },
    },
  },
  plugins: [jwt()],
  trustedOrigins: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [],
});
