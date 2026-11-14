// settings.tsx — Global Settings System
// Manages all user preferences: theme, layout, typography, performance, dinosaur display
// Pattern: Context API + localStorage (consistent with theme.tsx)

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'dark' | 'light'
export type LayoutMode = 'grid' | 'list'
export type CompactMode = 'comfortable' | 'compact' | 'spacious'
export type FontSize = 'small' | 'normal' | 'large'
export type SortOption = 'name' | 'period' | 'size' | 'diet'

export interface DinoProjectSettings {
  // Theme & Appearance
  theme: Theme
  accentColor: string // e.g., '#10b981' (green), '#3b82f6' (blue), '#f59e0b' (amber)
  dinoTheme: boolean // Enable dino-themed UI style

  // Layout Controls
  layoutMode: LayoutMode // grid or list for dinosaur display
  compactMode: CompactMode // comfortable, compact, or spacious

  // Typography
  fontSize: FontSize // small, normal, large
  dyslexiaFriendly: boolean // Use dyslexia-friendly font (OpenDyslexic)

  // Performance Options
  reduceAnimations: boolean // Disable animations for accessibility
  lowQualityImages: boolean // Use lower quality images for faster loading

  // Dinosaur Display Preferences
  defaultSort: SortOption // How to sort dinosaurs by default
  showWikipediaLinks: boolean // Show Wikipedia reference section
  showAISuggestions: boolean // Show AI Dino Assistant on pages
  showAchievements: boolean // Show achievement badges

  // Accessibility
  highContrast: boolean // Increase contrast for readability
}

export interface SettingsContextType {
  settings: DinoProjectSettings
  updateSetting: <K extends keyof DinoProjectSettings>(key: K, value: DinoProjectSettings[K]) => void
  updateSettings: (partial: Partial<DinoProjectSettings>) => void
  resetSettings: () => void
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const DEFAULT_SETTINGS: DinoProjectSettings = {
  theme: 'dark',
  accentColor: '#10b981', // green-500
  dinoTheme: false,

  layoutMode: 'grid',
  compactMode: 'comfortable',

  fontSize: 'normal',
  dyslexiaFriendly: false,

  reduceAnimations: false,
  lowQualityImages: false,

  defaultSort: 'name',
  showWikipediaLinks: true,
  showAISuggestions: true,
  showAchievements: true,

  highContrast: false,
}

// ============================================================================
// CONTEXT & PROVIDER
// ============================================================================

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DinoProjectSettings>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('dino-settings')
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (err) {
      console.error('Failed to load settings from localStorage:', err)
    }
    return DEFAULT_SETTINGS
  })

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('dino-settings', JSON.stringify(settings))
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err)
    }
  }, [settings])

  // Apply theme class to document
  useEffect(() => {
    const html = document.documentElement
    if (settings.theme === 'light') {
      html.classList.add('light-mode')
    } else {
      html.classList.remove('light-mode')
    }
  }, [settings.theme])

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', settings.accentColor)
  }, [settings.accentColor])

  // Apply compact mode as data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-compact', settings.compactMode)
  }, [settings.compactMode])

  // Apply font size as data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', settings.fontSize)
  }, [settings.fontSize])

  // Apply accessibility settings
  useEffect(() => {
    if (settings.reduceAnimations) {
      document.documentElement.style.setProperty('--animation-duration', '0ms')
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.style.removeProperty('--animation-duration')
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [settings.reduceAnimations])

  // Apply dyslexia-friendly font
  useEffect(() => {
    if (settings.dyslexiaFriendly) {
      document.documentElement.classList.add('dyslexia-friendly')
    } else {
      document.documentElement.classList.remove('dyslexia-friendly')
    }
  }, [settings.dyslexiaFriendly])

  // Apply high contrast
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [settings.highContrast])

  const updateSetting = <K extends keyof DinoProjectSettings>(
    key: K,
    value: DinoProjectSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateSettings = (partial: Partial<DinoProjectSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  const value: SettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
