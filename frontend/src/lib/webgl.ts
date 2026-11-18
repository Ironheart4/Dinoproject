let cachedSupport: boolean | null = null

export function isWebGLAvailable(): boolean {
  if (cachedSupport !== null) return cachedSupport
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedSupport = false
    return cachedSupport
  }

  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

    if (!context) {
      cachedSupport = false
      return cachedSupport
    }

    const loseContext = context.getExtension('WEBGL_lose_context')
    loseContext?.loseContext()
    cachedSupport = true
  } catch {
    cachedSupport = false
  }

  return cachedSupport
}
