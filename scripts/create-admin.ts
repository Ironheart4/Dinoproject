// Create admin user in Supabase Auth
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env");
  console.log("\n📝 To get your service role key:");
  console.log("   1. Go to https://supabase.com/dashboard/project/mrhcjbprjtirrxwtudbl/settings/api");
  console.log("   2. Copy the 'service_role' key (keep it secret!)");
  console.log("   3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log("🔐 Creating admin user in Supabase Auth...\n");

  // Create user in auth.users
  const { data, error } = await supabase.auth.admin.createUser({
    email: "dinoprojectoriginal@gmail.com",
    password: "Dinodonot@4getadmin",
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: "Admin"
    }
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("ℹ️  User already exists, updating to admin...");
      
      // Find and update existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === "dinoprojectoriginal@gmail.com");
      
      if (existingUser) {
        // Update the users table to make them admin
        const { error: updateError } = await supabase
          .from("users")
          .upsert({
            id: existingUser.id,
            name: "Admin",
            role: "admin"
          });
        
        if (updateError) {
          console.error("❌ Failed to update user role:", updateError);
        } else {
          console.log("✅ Admin user updated successfully!");
        }
      }
      return;
    }
    
    console.error("❌ Failed to create user:", error);
    return;
  }

  console.log("✅ Auth user created:", data.user?.email);

  // Now create/update the user in our users table with admin role
  const { error: profileError } = await supabase
    .from("users")
    .upsert({
      id: data.user!.id,
      name: "Admin",
      role: "admin"
    });

  if (profileError) {
    console.error("❌ Failed to create user profile:", profileError);
    return;
  }

  console.log("✅ Admin profile created in users table");
  console.log("\n🎉 Admin user created successfully!");
  console.log("   Email: dinoprojectoriginal@gmail.com");
  console.log("   Password: Dinodonot@4getadmin");
  console.log("   Role: admin");
}

createAdminUser()
  .catch(console.error)
  .finally(() => process.exit(0));
