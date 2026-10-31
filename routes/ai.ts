import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { parsePositiveInt, parseBoundedNumber } from "../middleware/validate";

export interface RouteDependencies {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  authLimiter: RequestHandler;
  aiLimiter: RequestHandler;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  upload?: any;
  supabaseStorage?: any;
  profileStorageBucket?: string;
}

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";
const aiResponseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30;
const MAX_CACHE_SIZE = 100;
function cleanCache(): void {
  const now = Date.now();
  for (const [key, value] of aiResponseCache.entries()) if (now - value.timestamp > CACHE_TTL) aiResponseCache.delete(key);
  if (aiResponseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(aiResponseCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    entries.slice(0, entries.length - MAX_CACHE_SIZE).forEach(([key]) => aiResponseCache.delete(key));
  }
}
function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

export function createAiRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// AI Chat endpoint - Premium users only
router.post("/api/ai/chat", deps.aiLimiter, deps.authMiddleware, async (req: any, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "Message must be 2,000 characters or fewer" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admins always have access
    const isAdmin = userRole === "admin";

    // Check if user is Premium or Donor (skip for admins)
    if (!isAdmin) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: "active",
          plan: { in: ["premium", "donor"] },
        },
      });

      if (!subscription) {
        return res.status(403).json({
          error: "Premium required",
          message: "AI Assistant is available for Premium and Donor members only. Upgrade to access DinoBot!"
        });
      }
    }

    // Check cache first
    const cacheKey = normalizeQuestion(message);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ response: cached.response, cached: true });
    }

    // If no Hugging Face key, use fallback
    if (!HUGGINGFACE_API_KEY) {
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse });
    }

    // Build dinosaur-focused prompt for Flan-T5
    const prompt = buildDinoPrompt(message);

    // Call Hugging Face Inference API
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          do_sample: true,
        },
        options: {
          wait_for_model: true, // Wait if model is loading
        },
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      console.warn("Hugging Face rate limit hit");
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse, rateLimited: true });
    }

    // Handle model loading
    if (response.status === 503) {
      const data = await response.json() as { error?: string; estimated_time?: number };
      if (data.error?.includes("loading")) {
        return res.status(503).json({
          error: "Model loading",
          message: "DinoBot is warming up! Please try again in a few seconds.",
          estimatedTime: data.estimated_time || 20
        });
      }
    }

    if (!response.ok) {
      console.error("Hugging Face API error:", response.status);
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse });
    }

    const data = await response.json() as Array<{ generated_text?: string }> | { generated_text?: string } | string;

    // Handle empty or invalid response
    let aiResponse = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      aiResponse = data[0].generated_text;
    } else if (typeof data === "string") {
      aiResponse = data;
    } else if (typeof data === "object" && "generated_text" in data && data.generated_text) {
      aiResponse = data.generated_text;
    }

    // If response is empty or too short, use fallback
    if (!aiResponse || aiResponse.trim().length < 10) {
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse });
    }

    // Format and enhance the response
    const formattedResponse = formatDinoResponse(aiResponse, message);

    // Cache the response
    cleanCache();
    aiResponseCache.set(cacheKey, { response: formattedResponse, timestamp: Date.now() });

    res.json({ response: formattedResponse });
  } catch (error) {
    console.error("AI chat error:", error);
    const fallbackResponse = await getLocalDinoResponse(req.body.message || "");
    res.json({ response: fallbackResponse });
  }
});

// Build a dinosaur-focused prompt for Flan-T5
function buildDinoPrompt(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  // Specific prompts for common dinosaur questions
  if (msg.includes("t-rex") || msg.includes("tyrannosaurus")) {
    return `Answer this question about Tyrannosaurus Rex: ${userMessage}. Include facts about its size, diet, and when it lived.`;
  }

  if (msg.includes("velociraptor")) {
    return `Answer this question about Velociraptor: ${userMessage}. Mention it was actually turkey-sized with feathers.`;
  }

  if (msg.includes("biggest") || msg.includes("largest") || msg.includes("huge")) {
    return `What were the largest dinosaurs? Answer: ${userMessage}`;
  }

  if (msg.includes("smallest") || msg.includes("tiny")) {
    return `What were the smallest dinosaurs? Answer: ${userMessage}`;
  }

  if (msg.includes("when") || msg.includes("period") || msg.includes("era")) {
    return `Question about dinosaur time periods: ${userMessage}. Mention Triassic, Jurassic, or Cretaceous periods.`;
  }

  if (msg.includes("eat") || msg.includes("diet") || msg.includes("food")) {
    return `Question about dinosaur diets: ${userMessage}. Explain herbivore, carnivore, or omnivore diets.`;
  }

  if (msg.includes("extinct") || msg.includes("die") || msg.includes("asteroid")) {
    return `Why did dinosaurs go extinct? Answer: ${userMessage}`;
  }

  // General dinosaur question
  return `You are a dinosaur expert. Answer this question about dinosaurs or prehistoric life: ${userMessage}`;
}

// Format and enhance the AI response
function formatDinoResponse(aiResponse: string, originalQuestion: string): string {
  let response = aiResponse.trim();

  // Add emoji based on content
  const msg = originalQuestion.toLowerCase();
  if (msg.includes("t-rex") || msg.includes("carnivore") || msg.includes("meat")) {
    response = "🦖 " + response;
  } else if (msg.includes("sauropod") || msg.includes("long neck") || msg.includes("herbivore")) {
    response = "🦕 " + response;
  } else {
    response = "🦴 " + response;
  }

  // Add a helpful suffix occasionally
  if (!response.includes("Encyclopedia") && response.length < 200) {
    response += "\n\n💡 Explore our Encyclopedia to learn more!";
  }

  return response;
}

// Local fallback responses for dinosaur FAQs
// Local fallback for AI — uses the database to build short, helpful FAQ-style replies
// This runs when the external model is unavailable or returns empty/short responses
async function getLocalDinoResponse(message: string): Promise<string> {
  const msg = message.toLowerCase();

  // Try to find relevant dinosaur from database
  const dinos = await prisma.dinosaur.findMany({ take: 100 });
  const matchedDino = dinos.find(d =>
    (d.name && msg.includes(d.name.toLowerCase())) ||
    (d.species && msg.includes(d.species.toLowerCase()))
  );

  if (matchedDino) {
    return `🦕 **${matchedDino.name}** is a fascinating dinosaur! ${matchedDino.description || `It was a ${matchedDino.diet || 'dinosaur'} from the ${matchedDino.period || 'prehistoric era'}.`} Check out its page in our Encyclopedia to see the 3D model and learn more!`;
  }

  // General responses
  if (msg.includes("t-rex") || msg.includes("tyrannosaurus")) {
    return "🦖 **Tyrannosaurus Rex** was one of the largest land carnivores ever! With teeth up to 12 inches long and a bite force of over 12,000 pounds, T-Rex was the apex predator of the Late Cretaceous period (68-66 million years ago). It could grow up to 40 feet long and weigh 9 tons!";
  }

  if (msg.includes("velociraptor")) {
    return "🦖 **Velociraptor** was actually much smaller than shown in movies - about the size of a turkey (6 feet long, 2 feet tall)! They had feathers and were incredibly smart hunters from the Late Cretaceous period, living in what is now Mongolia.";
  }

  if (msg.includes("biggest") || msg.includes("largest")) {
    return "🦕 The **Argentinosaurus** is one of the largest dinosaurs ever discovered, estimated to be up to 100 feet long and weigh 70-100 tons! Other giants include Patagotitan and Dreadnoughtus. These sauropods were true titans of the prehistoric world.";
  }

  if (msg.includes("smallest")) {
    return "🐣 The **Microraptor** was one of the smallest dinosaurs, only about 2-3 feet long including its tail! It had four wings and could likely glide between trees. The Compsognathus was another tiny dino, about the size of a chicken.";
  }

  if (msg.includes("extinct") || msg.includes("die") || msg.includes("asteroid")) {
    return "☄️ Dinosaurs went extinct about 66 million years ago when a massive asteroid (about 6 miles wide) hit what is now Mexico's Yucatan Peninsula. The impact caused tsunamis, fires, and a 'nuclear winter' that blocked sunlight, killing about 75% of all species.";
  }

  if (msg.includes("period") || msg.includes("era") || msg.includes("when")) {
    return "🌍 Dinosaurs lived during the Mesozoic Era, divided into three periods:\n• **Triassic** (252-201 million years ago) - First dinosaurs appeared\n• **Jurassic** (201-145 million years ago) - Giant sauropods dominated\n• **Cretaceous** (145-66 million years ago) - T-Rex, Triceratops, and the extinction event";
  }

  if (msg.includes("eat") || msg.includes("diet") || msg.includes("food")) {
    return "🥬 Dinosaurs had three main diets:\n• **Herbivores** (plant-eaters) like Triceratops and Brachiosaurus\n• **Carnivores** (meat-eaters) like T-Rex and Velociraptor\n• **Omnivores** (both) like Ornithomimus\n\nSome herbivores ate up to 1,000 pounds of plants daily!";
  }

  if (msg.includes("quiz")) {
    return "🧠 Ready to test your dinosaur knowledge? Head over to our **Quiz** section! We have questions about dinosaur diets, time periods, sizes, and more. Can you get a perfect score?";
  }

  if (msg.includes("premium") || msg.includes("subscribe")) {
    return "⭐ **DinoProject Premium** gives you access to HD 3D models, unlimited favorites, AI DinoBot, and exclusive content! You can also become a **Donor** to support our mission. Check out the Subscription page!";
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return "👋 Hello, fellow dinosaur enthusiast! I'm DinoBot, your prehistoric guide! Ask me anything about dinosaurs - their diets, sizes, time periods, or specific species. What would you like to learn about today?";
  }

  if (msg.includes("fossil") || msg.includes("bone")) {
    return "🦴 Fossils are the preserved remains of ancient life! Dinosaur fossils form when bones are buried in sediment and minerals slowly replace the bone material over millions of years. The first dinosaur fossil was scientifically described in 1824!";
  }

  if (msg.includes("bird") || msg.includes("chicken")) {
    return "🐔 Yes, birds ARE dinosaurs! They evolved from small theropod dinosaurs during the Jurassic period. The closest living relatives of T-Rex are actually chickens and ostriches! So technically, dinosaurs never went fully extinct.";
  }

  // Default response
  return "🦕 Great question! I'm DinoBot, your dinosaur expert. I can tell you about:\n• Specific dinosaurs (T-Rex, Velociraptor, etc.)\n• Dinosaur diets and sizes\n• Time periods and extinction\n• Fossils and discoveries\n\nWhat would you like to know?";
}

  return router;
}
