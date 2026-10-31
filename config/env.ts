import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || "",
  supabaseUrl: process.env.SUPABASE_URL || "https://example.supabase.co",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "test-anon-key",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "test-anon-key",
  profileBucket: process.env.SUPABASE_PROFILE_BUCKET || "profile-pictures",
  paypalClientId: process.env.PAYPAL_CLIENT_ID,
  paypalSecret: process.env.PAYPAL_SECRET,
  paypalApi: process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
};
