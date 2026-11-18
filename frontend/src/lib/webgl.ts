let webglUnavailable = false

export function reportWebGLFailure(): void {
  webglUnavailable = true
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (!('WebGLRenderingContext' in window)) return false
  return !webglUnavailable
}
