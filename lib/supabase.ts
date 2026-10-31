import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
export const supabaseStorage: SupabaseClient = createClient(env.supabaseUrl, env.supabaseServiceKey);
