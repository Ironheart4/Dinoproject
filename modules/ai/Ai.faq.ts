/**
 * Built-in DinoBot answers, used when the external model is unavailable or returns nothing useful.
 * Pure functions: no database, no network.
 */

export interface DinosaurFacts {
  name: string | null;
  species: string | null;
  description: string | null;
  diet: string | null;
  period: string | null;
}

/** Finds the first dinosaur whose common name or species appears in the message. */
export function matchDinosaur<T extends Pick<DinosaurFacts, "name" | "species">>(
  message: string,
  dinosaurs: readonly T[],
): T | undefined {
  const msg = message.toLowerCase();
  return dinosaurs.find(
    (d) =>
      (d.name && msg.includes(d.name.toLowerCase())) ||
      (d.species && msg.includes(d.species.toLowerCase())),
  );
}

export function describeDinosaur(dino: DinosaurFacts): string {
  const detail = dino.description || `It was a ${dino.diet || "dinosaur"} from the ${dino.period || "prehistoric era"}.`;
  return `🦕 **${dino.name}** is a fascinating dinosaur! ${detail} Check out its page in our Encyclopedia to see the 3D model and learn more!`;
}

/** Normalizes a question so repeated questions share one cache entry. */
export function normalizeQuestion(question: string): string {
  return question.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

export function faqResponse(message: string): string {
  const msg = message.toLowerCase();

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
    return "⭐ **DinoProject Premium** gives you access to HD 3D models, unlimited favorites, and exclusive content! DinoBot itself is free for every logged-in member. You can also become a **Donor** to support our mission. Check out the Subscription page!";
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

  return "🦕 Great question! I'm DinoBot, your dinosaur expert. I can tell you about:\n• Specific dinosaurs (T-Rex, Velociraptor, etc.)\n• Dinosaur diets and sizes\n• Time periods and extinction\n• Fossils and discoveries\n\nWhat would you like to know?";
}
