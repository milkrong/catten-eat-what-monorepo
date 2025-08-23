import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

const connectionString = process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(connectionString, { max: 1 });

export const db = drizzle(queryClient, { schema });

// This is optional - but recommended for type safety
export type DB = typeof db; 