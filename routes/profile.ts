import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { parsePositiveInt, parseBoundedNumber } from "../middleware/validate";

export interface RouteDependencies {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  authLimiter?: RequestHandler;
  aiLimiter?: RequestHandler;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  upload?: any;
  supabaseStorage?: any;
  profileStorageBucket?: string;
}

function getStoredProfilePath(profilePic: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  return profilePic.startsWith(marker) ? profilePic.slice(marker.length) : null;
}

export function createProfileRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
router.put("/api/user/profile", deps.authMiddleware, async (req: any, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      email: req.user.email,
      bio: updated.bio,
      profilePic: updated.profilePic,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Upload profile picture to Supabase Storage
router.post("/api/user/profile-pic", deps.authMiddleware, upload.single("profilePic"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.id;
    const extension = req.file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const storagePath = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const { error: uploadError } = await supabaseStorage.storage
      .from(profileStorageBucket)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const oldUser = await prisma.user.findUnique({ where: { id: userId }, select: { profilePic: true } });
    const oldPath = oldUser?.profilePic ? getStoredProfilePath(oldUser.profilePic, profileStorageBucket!) : null;
    if (oldPath) {
      await supabaseStorage.storage.from(profileStorageBucket).remove([oldPath]);
    }

    const { data: publicUrlData } = supabaseStorage.storage
      .from(profileStorageBucket)
      .getPublicUrl(storagePath);
    const profilePicUrl = publicUrlData.publicUrl;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profilePic: profilePicUrl },
    });

    res.json({
      profilePic: updated.profilePic,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Upload profile pic error:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
});

// Delete profile picture
router.delete("/api/user/profile-pic", deps.authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { profilePic: true } });
    const profilePath = user?.profilePic ? getStoredProfilePath(user.profilePic, profileStorageBucket!) : null;
    if (profilePath) {
      await supabaseStorage.storage.from(profileStorageBucket).remove([profilePath]);
    }

    // Clear profile pic in database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePic: null },
    });

    res.json({ message: "Profile picture removed successfully" });
  } catch (error) {
    console.error("Delete profile pic error:", error);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
});

// Get current user details
router.get("/api/user/me", deps.authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { subscription: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: req.user.email,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      subscription: user.subscription || { plan: "free", status: "active" },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});



// ==================== PAYPAL PAYMENT ENDPOINTS ====================

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// Create PayPal order for subscription

  return router;
}
