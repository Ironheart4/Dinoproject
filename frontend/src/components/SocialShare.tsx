// SocialShare.tsx — Social Media Sharing Component
// ================================================
// PURPOSE: Allows users to share content to social media platforms
// FEATURES:
// - Twitter/X sharing with custom text and hashtags
// - Facebook sharing with quote
// - WhatsApp sharing with message + URL
// - Copy link to clipboard functionality
// - Native Web Share API support (mobile devices)
// - Two variants: 'buttons' (full labels) or 'icons' (compact)
//
// USAGE:
// <SocialShare
//   title="My Quiz Results"
//   text="I scored 90% on DinoProject!"
//   hashtags={['DinoProject', 'Quiz']}
//   variant="buttons"
// />
//
// PLATFORMS SUPPORTED:
// - Twitter/X: Opens tweet composer with text, URL, hashtags
// - Facebook: Opens share dialog with link and quote
// - WhatsApp: Opens chat with pre-filled message
// - Native Share: Uses device's share sheet (mobile only)
// ================================================
import { FaTwitter, FaFacebook, FaWhatsapp, FaLink } from 'react-icons/fa'
import { useState } from 'react'

// ================================================
// TYPE DEFINITIONS
// ================================================

/** Props for SocialShare component */
interface SocialShareProps {
  title: string          // Title for native share (mobile)
  text: string           // Main share text/message
  url?: string           // URL to share (defaults to current page)
  hashtags?: string[]    // Hashtags for Twitter (without #)
  variant?: 'buttons' | 'icons'  // Display style
  className?: string     // Additional CSS classes
}

// ================================================
// MAIN COMPONENT
// ================================================

export default function SocialShare({
  title,
  text,
  url = window.location.href,   // Default to current page URL
  hashtags = ['DinoProject', 'Dinosaurs'],  // Default hashtags
  variant = 'icons',             // Default to compact view
  className = ''
}: SocialShareProps) {
  // Track copy-to-clipboard state for visual feedback
  const [copied, setCopied] = useState(false)

  // URL-encode text and URL for share links
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(url)
  const hashtagString = hashtags.join(',')

  // Pre-built share URLs for each platform
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${hashtagString}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
  }

  /**
   * Copy the share URL to clipboard
   * Shows "Copied!" feedback for 2 seconds
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)  // Reset after 2s
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  /**
   * Use native Web Share API (available on mobile devices)
   * Falls back gracefully if not supported or user cancels
   */
  const handleNativeShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ title, text, url })
      } catch (err) {
        // Don't log error if user just cancelled the share
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }

  // ================================================
  // RENDER: BUTTONS VARIANT (full-width with labels)
  // ================================================
  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {/* Twitter/X share button */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition"
        >
          <FaTwitter /> Twitter
        </a>
        {/* Facebook share button */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#4267B2] text-white rounded-lg hover:bg-[#365899] transition"
        >
          <FaFacebook /> Facebook
        </a>
        {/* WhatsApp share button */}
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1da851] transition"
        >
          <FaWhatsapp /> WhatsApp
        </a>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
        >
          <FaLink /> {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    )
  }

  // Icon variant (compact)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-gray-400 text-sm mr-1">Share:</span>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-[#1DA1F2] hover:bg-gray-800 rounded-full transition"
        title="Share on Twitter"
      >
        <FaTwitter size={18} />
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-[#4267B2] hover:bg-gray-800 rounded-full transition"
        title="Share on Facebook"
      >
        <FaFacebook size={18} />
      </a>
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-gray-800 rounded-full transition"
        title="Share on WhatsApp"
      >
        <FaWhatsapp size={18} />
      </a>
      <button
        onClick={copyToClipboard}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition"
        title={copied ? 'Copied!' : 'Copy Link'}
      >
        <FaLink size={18} />
      </button>
      {'share' in navigator && (
        <button
          onClick={handleNativeShare}
          className="ml-1 px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition"
        >
          Share
        </button>
      )}
    </div>
  )
}
