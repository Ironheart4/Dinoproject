import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const STORAGE_KEY = 'dinoproject.visitTrail'
const MAX_ITEMS = 8

const PAGE_LABELS: Record<string, string> = {
  '/': 'Welcome',
  '/home': 'Home',
  '/encyclopedia': 'Encyclopedia',
  '/dino-world': 'Dino World',
  '/timeline': 'Timeline',
  '/quiz': 'Quiz',
  '/battle': 'Battle',
  '/forum': 'Forum',
  '/about': 'About Us',
  '/support': 'Support Us',
  '/support/success': 'Support Confirmation',
  '/login': 'Login',
  '/dashboard': 'Dashboard',
  '/settings': 'Settings',
  '/privacy': 'Privacy Policy',
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function titleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path]

  const dinoMatch = path.match(/^\/dino\/([^/]+)$/)
  if (dinoMatch) return `Dinosaur #${safeDecode(dinoMatch[1])}`

  const categoryMatch = path.match(/^\/forum\/category\/([^/]+)$/)
  if (categoryMatch) return `Forum: ${titleCase(safeDecode(categoryMatch[1]))}`

  const postMatch = path.match(/^\/forum\/post\/([^/]+)$/)
  if (postMatch) return `Forum Post #${safeDecode(postMatch[1])}`

  const quizMatch = path.match(/^\/quiz\/([^/]+)$/)
  if (quizMatch) return 'Quiz'

  const lastSegment = path.split('/').filter(Boolean).pop()
  return lastSegment ? titleCase(safeDecode(lastSegment)) : 'Home'
}

function normalizeTrail(trail: string[]): string[] {
  const recent = trail.filter(path => path !== '/').slice(-(MAX_ITEMS - 1))
  return ['/', ...recent]
}

function readTrail(): string[] {
  if (typeof window === 'undefined') return ['/']

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return ['/']
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return ['/']
    return normalizeTrail(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return ['/']
  }
}

function writeTrail(trail: string[]): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trail))
  } catch {}
}

export default function VisitedBreadcrumbs() {
  const { pathname } = useLocation()
  const currentPath = normalizePath(pathname)
  const [trail, setTrail] = useState<string[]>(() => {
    const saved = readTrail()
    if (saved[saved.length - 1] === currentPath) return saved
    return normalizeTrail([...saved, currentPath])
  })

  useEffect(() => {
    setTrail(previous => {
      if (previous[previous.length - 1] === currentPath) return previous
      return normalizeTrail([...previous, currentPath])
    })
  }, [currentPath])

  useEffect(() => {
    writeTrail(trail)
  }, [trail])

  const visibleTrail =
    trail[trail.length - 1] === currentPath
      ? trail
      : normalizeTrail([...trail, currentPath])

  const rewindTrail = (index: number) => {
    const next = normalizeTrail(visibleTrail.slice(0, index + 1))
    setTrail(next)
    writeTrail(next)
  }

  return (
    <nav aria-label="Pages visited" className="mb-4 sm:mb-5">
      <ol className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs text-gray-400 sm:gap-2 sm:text-sm">
        {visibleTrail.map((path, index) => {
          const isCurrent = index === visibleTrail.length - 1
          return (
            <li key={`${path}-${index}`} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {index > 0 && (
                <span className="font-medium text-gray-600" aria-hidden="true">
                  &gt;
                </span>
              )}
              {isCurrent ? (
                <span aria-current="page" className="font-medium text-green-400">
                  {getLabel(path)}
                </span>
              ) : (
                <Link
                  to={path}
                  onClick={() => rewindTrail(index)}
                  className="transition-colors hover:text-green-400"
                >
                  {getLabel(path)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
