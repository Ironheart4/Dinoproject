// scripts/seed.ts — seeds the database with sample dinosaurs and a quiz
// Purpose: populate the database for local development or for quick testing on a fresh DB
// Note: Users are managed by Supabase Auth. To create users use Supabase Dashboard or the Auth endpoints
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🦕 Seeding DinoProject database (Supabase)...");
  console.log("Note: Users are created via Supabase Auth, not this seed script.");

  // Seed Aardonyx (complete example from CSV)
  const aardonyx = await prisma.dinosaur.upsert({
    where: { species: "celestae" },
    update: {},
    create: {
      name: "Aardonyx",
      species: "celestae",
      diet: "herbivorous",
      period: "Early Jurassic 199-189 million years ago",
      livedIn: "South Africa",
      type: "sauropod",
      lengthMeters: 6.5,
      taxonomy: "Dinosauria Saurischia Sauropodomorpha Prosauropoda Anchisauria",
      namedBy: "Yates Bonnan Neveling Chinsamy and Blackbeard 2010 (2009)",
      habitat: "Land",
      weightKg: 1350,
      description: "Aardonyx celestae was an early herbivorous dinosaur from what is now South Africa. It represents an important evolutionary stage between smaller, bipedal plant-eaters and the massive, long-necked sauropods that would later dominate the Jurassic period. Aardonyx likely walked on its hind legs most of the time but could use its forelimbs for feeding, showing early adaptations toward a quadrupedal lifestyle. Its discovery helped scientists understand how giant sauropods evolved from smaller ancestors.",
      modelUrl: "https://cdn.jsdelivr.net/gh/Ironheart4/dino-models@main/models/Aardonyx.glb",
      roarSound: "https://cdn.jsdelivr.net/gh/Ironheart4/dino-sounds@main/sounds/Aardonyx_sound.mp3",
      videoUrl: "https://www.youtube.com/embed/K6T_pxFOlvs?si=mYLFHyFA00BCd6Tl",
      imageUrl: "https://i.postimg.cc/YC3J22y2/Aardonyx-main1.png",
      imageUrl1: "https://i.postimg.cc/YC3J22y2/Aardonyx-main1.png",
      imageUrl2: "https://i.postimg.cc/4xZDTHPH/Aardonyx-main2.png",
      imageUrl3: "https://i.postimg.cc/SxrwQQtm/Aardonyx-main3.png",
      imageUrl4: "https://i.postimg.cc/8kfQdSs0/Aardonyx-main4.png",
      imageUrl5: "https://static.wikia.nocookie.net/dino/images/f/fc/Aardonyx.2.jpg/revision/latest?cb=20130411005827",
    },
  });
  console.log("✅ Aardonyx seeded:", aardonyx.name);

  // Seed a few more dinosaurs with partial data (for catalog testing)
  // modelUrl is required - using placeholder for now
  const placeholderModel = "https://cdn.jsdelivr.net/gh/Ironheart4/dino-models@main/models/placeholder.glb";
  
  const partialDinos = [
    { name: "Abelisaurus", species: "comahuensis", diet: "carnivorous", period: "Late Cretaceous 74-70 million years ago", livedIn: "Argentina", type: "large theropod", lengthMeters: 8, weightKg: 2150, modelUrl: placeholderModel },
    { name: "Achelousaurus", species: "horneri", diet: "herbivorous", period: "Late Cretaceous 83-70 million years ago", livedIn: "USA", type: "ceratopsian", lengthMeters: 6, weightKg: 3000, modelUrl: placeholderModel },
    { name: "Achillobator", species: "giganteus", diet: "carnivorous", period: "Late Cretaceous 99-84 million years ago", livedIn: "Mongolia", type: "large theropod", lengthMeters: 5.5, weightKg: 500, modelUrl: placeholderModel },
    { name: "Acrocanthosaurus", species: "atokensis", diet: "carnivorous", period: "Early Cretaceous 115-105 million years ago", livedIn: "USA", type: "large theropod", lengthMeters: 12, weightKg: 6500, modelUrl: placeholderModel },
    { name: "Tyrannosaurus", species: "rex", diet: "carnivorous", period: "Late Cretaceous 68-66 million years ago", livedIn: "USA", type: "large theropod", lengthMeters: 12.3, weightKg: 8400, modelUrl: placeholderModel },
    { name: "Triceratops", species: "horridus", diet: "herbivorous", period: "Late Cretaceous 68-66 million years ago", livedIn: "USA", type: "ceratopsian", lengthMeters: 9, weightKg: 6000, modelUrl: placeholderModel },
    { name: "Velociraptor", species: "mongoliensis", diet: "carnivorous", period: "Late Cretaceous 75-71 million years ago", livedIn: "Mongolia", type: "small theropod", lengthMeters: 2, weightKg: 15, modelUrl: placeholderModel },
    { name: "Brachiosaurus", species: "altithorax", diet: "herbivorous", period: "Late Jurassic 155-140 million years ago", livedIn: "USA", type: "sauropod", lengthMeters: 26, weightKg: 40000, modelUrl: placeholderModel },
    { name: "Stegosaurus", species: "stenops", diet: "herbivorous", period: "Late Jurassic 155-150 million years ago", livedIn: "USA", type: "armoured dinosaur", lengthMeters: 9, weightKg: 5000, modelUrl: placeholderModel },
  ];

  for (const dino of partialDinos) {
    await prisma.dinosaur.upsert({
      where: { species: dino.species },
      update: {},
      create: dino,
    });
  }
  console.log(`✅ ${partialDinos.length} partial dinosaurs seeded`);

  // Create a sample quiz
  const quiz = await prisma.quiz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Dinosaur Basics",
      questions: {
        create: [
          {
            questionText: "What did Tyrannosaurus rex primarily eat?",
            optionA: "Plants",
            optionB: "Meat",
            optionC: "Fish",
            optionD: "Insects",
            correctAnswer: "B",
          },
          {
            questionText: "In which period did Triceratops live?",
            optionA: "Triassic",
            optionB: "Jurassic",
            optionC: "Cretaceous",
            optionD: "Permian",
            correctAnswer: "C",
          },
          {
            questionText: "Which dinosaur is known for its long neck?",
            optionA: "Velociraptor",
            optionB: "Stegosaurus",
            optionC: "Brachiosaurus",
            optionD: "Triceratops",
            correctAnswer: "C",
          },
        ],
      },
    },
    include: { questions: true },
  });
  console.log("✅ Sample quiz created:", quiz.title);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 To create users, use Supabase Auth:");
  console.log("   1. Go to Supabase Dashboard > Authentication > Users");
  console.log("   2. Click 'Add user' > 'Create new user'");
  console.log("   3. Enter email and password");
  console.log("   4. The user will be auto-created in your users table on first login");
  console.log("\n💡 To make a user admin:");
  console.log("   UPDATE users SET role = 'admin' WHERE id = '<user-uuid>';");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
