import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config/env";

/** Anonymous client: used to verify user tokens and run sign-in/sign-up. */
export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);

/** Service-role client: used for server-side storage operations. Never expose it to the browser. */
export const supabaseStorage: SupabaseClient = createClient(env.supabaseUrl, env.supabaseServiceKey);
