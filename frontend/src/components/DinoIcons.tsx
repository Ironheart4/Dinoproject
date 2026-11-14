// DinoIcons.tsx — Custom dinosaur-themed icons for the UI
// Used to replace generic DNA icons throughout the app
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

// Triceratops silhouette icon  
export function TriceratopsIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="currentColor" 
      className={className}
      {...props}
    >
      <path d="M60 24l-6-4-4-8c-1-2-3-3-5-3h-6l-4-4c-2-2-5-2-7 0l-4 4h-4c-2 0-4 1-5 3l-2 4-8 4c-2 1-3 3-3 5v6c0 2 1 4 3 5l4 2v4c0 3 2 5 4 6l2 2v8c0 2 2 4 4 4h4c2 0 4-2 4-4v-4h8v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-8l2-2c2-2 3-4 3-7v-4l4-2c2-1 3-3 3-5v-6c0-2-1-4-3-5zM16 28c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/>
    </svg>
  )
}

// Brachiosaurus/long-neck silhouette icon
export function BrachioIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="currentColor" 
      className={className}
      {...props}
    >
      <path d="M52 46v-4c0-3-2-5-4-6v-8c0-3-2-6-4-8v-8c0-2-1-4-3-5l-4-4c-1-1-3-2-5-2h-2c-2 0-4 1-5 2l-2 3-4 2c-2 1-3 3-3 5v6l-4 4c-2 2-3 5-3 8v10c-2 1-3 3-3 5v6c0 2 2 4 4 4h4c2 0 4-2 4-4v-4h4v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-4h4v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-6c0-2-1-4-3-5zM28 16c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/>
    </svg>
  )
}

// Stegosaurus silhouette icon
export function StegoIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="currentColor" 
      className={className}
      {...props}
    >
      <path d="M58 40l-4-2v-2c0-3-2-5-4-6l2-4c1-2 1-4 0-6l-2-4 2-4c1-2 0-4-1-6l-4-4c-2-1-4-1-6 0l-4 4-4-2c-2-1-4-1-6 0l-4 2-4-4c-2-2-4-2-6-1l-4 4c-2 2-2 4-1 6l2 4-2 4c-1 2-1 4 0 6l2 4c-2 1-4 3-4 6v6l-4 2c-2 1-3 3-3 5v4c0 2 2 4 4 4h6c2 0 4-2 4-4v-2h4v2c0 2 2 4 4 4h6c2 0 4-2 4-4v-2h4v2c0 2 2 4 4 4h6c2 0 4-2 4-4v-4c0-2-1-4-3-5zM14 32c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/>
    </svg>
  )
}

// Pterodactyl/flying dinosaur silhouette icon
export function PteroIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="currentColor" 
      className={className}
      {...props}
    >
      <path d="M60 20c-1-2-3-3-5-3l-8 1-4-6c-1-2-4-3-6-2l-6 2-6-2c-2-1-5 0-6 2l-4 6-8-1c-2 0-4 1-5 3s-1 4 0 6l4 6-2 8c0 2 1 4 3 5l8 4 2 8c0 2 2 4 4 4h2l6-4 6 4h2c2 0 4-2 4-4l2-8 8-4c2-1 3-3 3-5l-2-8 4-6c1-2 1-4 0-6zM20 28c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/>
    </svg>
  )
}

// Raptor/velociraptor silhouette icon
export function RaptorIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="currentColor" 
      className={className}
      {...props}
    >
      <path d="M56 18l-4-4c-2-2-4-2-6-1l-4 2-2-4c-1-2-3-3-5-3h-4c-2 0-4 1-5 3l-2 4-4-2c-2-1-5 0-6 2l-4 6c-1 2-1 4 0 6l2 4-4 4c-2 2-2 5-1 7l4 8c1 2 3 4 6 4h2l2 4c1 2 3 3 5 3h4v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-6l4-2c2-1 4-3 4-5l2-6 4-2c2-1 4-3 4-6v-6c0-2-1-4-3-5l-4-4v-4c0-2-1-4-2-5zM22 24c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z"/>
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

// Fossil/skeleton icon
export function FossilIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="currentColor" 
      className={className}
      {...props}
    >
      <path d="M56 28h-4v-4c0-2-2-4-4-4h-2v-4c0-2-2-4-4-4h-4c-2 0-4 2-4 4v4h-4v-4c0-2-2-4-4-4h-4c-2 0-4 2-4 4v4h-2c-2 0-4 2-4 4v4H8c-2 0-4 2-4 4v4c0 2 2 4 4 4h4v4c0 2 2 4 4 4h2v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-4h4v4c0 2 2 4 4 4h4c2 0 4-2 4-4v-4h2c2 0 4-2 4-4v-4h4c2 0 4-2 4-4v-4c0-2-2-4-4-4zM32 40c-4 0-8-4-8-8s4-8 8-8 8 4 8 8-4 8-8 8z"/>
    </svg>
  )
}
