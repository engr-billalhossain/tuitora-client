import { MongoClient, ObjectId, type Db } from "mongodb";

/* Reuse a single client across hot reloads in development. */
declare global {
  var __tuitoraMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!global.__tuitoraMongoClientPromise) {
    // Read at first use (request time) so `next build` does not fail while
    // collecting route data, when env vars may not be available.
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set in the environment");
    }
    global.__tuitoraMongoClientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
    }).connect();
  }
  return global.__tuitoraMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db("tuitoradb");
}

/** Builds a filter that matches both string ids and real ObjectIds. */
export function idFilter(id: string): Record<string, unknown> {
  const alternatives: Record<string, unknown>[] = [{ _id: id }];
  if (ObjectId.isValid(id)) {
    alternatives.push({ _id: new ObjectId(id) });
  }
  return { $or: alternatives };
}
