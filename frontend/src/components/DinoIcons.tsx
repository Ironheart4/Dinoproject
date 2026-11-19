// DinoIcons.tsx — Custom dinosaur-themed icons for the UI
import { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

// T-Rex silhouette icon
export function TRexIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M58 12c-2-2-5-3-8-2l-4 2c-1-2-3-4-6-4h-4c-3 0-5 2-6 4l-2-1c-2-1-4-1-6 0l-4 3c-2 2-3 4-2 7l2 6-4 4c-2 2-3 5-2 8l2 8c1 3 3 5 6 6h2v6c0 2 2 4 4 4h4c2 0 4-2 4-4v-4h4v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-8l4-4c2-2 3-4 3-7v-8l4-4c2-2 2-5 1-8l-3-8c-1-2-3-4-6-5zM20 28c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/>
    </svg>
  )
}

// Friendly robot T-Rex head for DinoBot
export function DinoBotIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 54V33C10 25 13 19 18 15C21 12 25 11 30 11C38 11 44 15 48 21L59 24C61.5 24.7 63 26.5 63 28.5C63 30.5 61.5 32.3 59 33L50 34L46 40C43 44 39 46 34 46V52C34 55 32 57 29 57H15C12 57 10 56 10 54ZM29 19A5 5 0 1 0 29 29A5 5 0 1 0 29 19ZM44 28H51C52 28 53 28.8 53 29.7C53 30.6 52 31.4 51 31.4H44C43 31.4 42 30.6 42 29.7C42 28.8 43 28 44 28ZM52 23.5A1.5 1.5 0 1 0 52 26.5A1.5 1.5 0 1 0 52 23.5Z"
      />
      <path d="M30 11V5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="30" cy="3.5" r="2.5"/>
    </svg>
  )
}

// Dinosaur footprint icon
export function DinoFootprint({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      {...props}
    >
      <ellipse cx="32" cy="40" rx="12" ry="16"/>
      <ellipse cx="20" cy="16" rx="5" ry="8" transform="rotate(-20 20 16)"/>
      <ellipse cx="32" cy="12" rx="5" ry="8"/>
      <ellipse cx="44" cy="16" rx="5" ry="8" transform="rotate(20 44 16)"/>
    </svg>
  )
}
