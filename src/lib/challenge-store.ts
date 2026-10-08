import { Challenge } from '@/lib/types';

/**
 * Simple in-memory challenge store.
 * In production you'd use a database, but this is perfect for MVP/hackathon.
 * Using globalThis prevents the store from being cleared during Next.js Hot Module Replacement (HMR).
 */
const globalForStore = globalThis as unknown as {
  challengeStore: Map<string, Challenge> | undefined;
};

const store = globalForStore.challengeStore ?? new Map<string, Challenge>();

if (process.env.NODE_ENV !== 'production') {
  globalForStore.challengeStore = store;
}

export function storeChallenge(challenge: Challenge): void {
  store.set(challenge.id, challenge);
}

export function getChallenge(id: string): Challenge | undefined {
  return store.get(id);
}

export function removeChallenge(id: string): void {
  store.delete(id);
}
