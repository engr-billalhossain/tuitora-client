import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db("tuitoradb");

export const auth = betterAuth({
    emailAndPassword: { 
    enabled: true, 
  }, 
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
        required: false,
        input: true,
      },
      // Billing state is server-owned. `input: false` keeps these fields out
      // of sign-up / update-user payloads so the browser cannot grant itself PRO.
      plan: {
        type: "string",
        defaultValue: "free",
        required: false,
        input: false,
      },
      proPlan: {
        type: "string",
        required: false,
        input: false,
      },
      proActivatedAt: {
        type: "string",
        required: false,
        input: false,
      },
      stripeCustomerId: {
        type: "string",
        required: false,
        input: false,
      },
      stripePaymentIntentId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  baseURL: process.env.BETTER_AUTH_URL, 
    socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
  
  database: mongodbAdapter(db, {
    client,
  }),
});