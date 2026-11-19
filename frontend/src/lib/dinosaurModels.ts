const MODEL_URL_FIXES: Record<string, string> = {
  Tyrannosaurus: 'https://cdn.jsdelivr.net/gh/Ironheart4/dino-models@main/models/t-rex.glb',
}

export function resolveDinosaurModelUrl(dino: { name: string; modelUrl: string | null }): string | null {
  return MODEL_URL_FIXES[dino.name] ?? dino.modelUrl
}
