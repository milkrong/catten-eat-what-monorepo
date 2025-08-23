import { InferModel } from 'drizzle-orm';
import { preferences } from '../db/schema';

export type Preference = InferModel<typeof preferences>;
export type NewPreference = InferModel<typeof preferences, 'insert'>; 