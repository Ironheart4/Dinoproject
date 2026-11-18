// supabase.ts — Supabase client wrapper used across the frontend
// Notes:
// - Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel for production
// - Never expose Supabase service_role keys on the frontend; only use anon publishable keys here
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mrhcjbprjtirrxwtudbl.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_gm4qqRPs5182s1pneYCr3w_pK5kmQYq";

let authQueue: Promise<unknown> = Promise.resolve();

function inMemoryLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const run = authQueue.then(fn, fn);
  authQueue = run.then(() => undefined, () => undefined);
  return run;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: inMemoryLock },
});

// Helper to get current session token
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
