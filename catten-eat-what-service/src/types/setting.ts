import { InferModel } from 'drizzle-orm';
import { settings } from '../db/schema';

export type Setting = InferModel<typeof settings>;
export type NewSetting = InferModel<typeof settings, 'insert'>; 