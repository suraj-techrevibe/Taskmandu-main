import type { FlattenMaps } from 'mongoose';

/**
 * Represents the plain-object shape returned by `.lean()` / `.toObject()`
 * for a mongoose document type `T`.
 */
export type Lean<T> = FlattenMaps<T>;
