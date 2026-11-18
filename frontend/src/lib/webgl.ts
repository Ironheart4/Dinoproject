const WEBGL_FAILURE_KEY = 'dinoproject.webglUnavailable'

let webglUnavailable = false

export function reportWebGLFailure(): void {
  webglUnavailable = true
  try {
    window.sessionStorage.setItem(WEBGL_FAILURE_KEY, '1')
  } catch {}
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (!('WebGLRenderingContext' in window)) return false
  if (webglUnavailable) return false
  try {
    if (window.sessionStorage.getItem(WEBGL_FAILURE_KEY) === '1') {
      webglUnavailable = true
      return false
    }
  } catch {}
  return true
}
