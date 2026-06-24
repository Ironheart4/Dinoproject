// Settings.tsx — Global Settings Page
// Comprehensive UI for customizing DinoProject experience
import { useState } from 'react'
import { useSettings } from '../lib/settings'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  Settings as SettingsIcon, Palette, Layout, Type, Zap, Eye, RotateCcw,
  Volume2, Image, Accessibility, Droplet, Grid3X3, List, Check, AlertCircle
} from 'lucide-react'

export default function Settings() {
  useDocumentTitle('Settings', ' — DinoProject')
  const { settings, updateSetting, updateSettings, resetSettings } = useSettings()
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  const showSaveMessage = (text: string, type: 'success' | 'info' = 'success') => {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleReset = () => {
    if (confirm('Are you sure? This will reset all settings to defaults.')) {
      resetSettings()
      showSaveMessage('Settings reset to defaults', 'info')
    }
  }

  const ACCENT_COLORS = [
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Lime', value: '#84cc16' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold font-display text-white flex items-center gap-3">
          <SettingsIcon size={32} className="text-green-400" />
          Settings
        </h1>
        <p className="text-gray-400">Customize your DinoProject experience</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          saveMessage.type === 'success'
            ? 'bg-green-900/30 border-green-700 text-green-400'
            : 'bg-blue-900/30 border-blue-700 text-blue-400'
        }`}>
          <Check size={20} />
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* ===== SECTION 1: THEME & APPEARANCE ===== */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Palette size={24} className="text-purple-400" />
            <span>Theme & Appearance</span>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Theme</h3>
              <p className="text-sm text-gray-400">Choose between dark and light mode</p>
            </div>
            <div className="flex gap-2">
              {['dark', 'light'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme as 'dark' | 'light')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    settings.theme === theme
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-white">Accent Color</h3>
              <p className="text-sm text-gray-400">Customize the primary brand color</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateSetting('accentColor', color.value)}
                  className="relative group"
                  title={color.name}
                >
                  <div
                    className={`w-12 h-12 rounded-lg transition transform hover:scale-110 border-2 ${
                      settings.accentColor === color.value
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                  {settings.accentColor === color.value && (
                    <Check size={16} className="absolute top-1 right-1 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Dino Theme */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.dinoTheme}
              onChange={(e) => updateSetting('dinoTheme', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Dino-Themed UI</h3>
              <p className="text-sm text-gray-400">Enable playful dinosaur-themed visual style</p>
            </div>
          </label>
        </div>

        {/* ===== SECTION 2: LAYOUT CONTROLS ===== */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Layout size={24} className="text-blue-400" />
            <span>Layout Controls</span>
          </div>

          {/* Display Mode */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Dinosaur Display</h3>
              <p className="text-sm text-gray-400">Choose how to view dinosaurs</p>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'grid', icon: Grid3X3, label: 'Grid' },
                { value: 'list', icon: List, label: 'List' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => updateSetting('layoutMode', value as 'grid' | 'list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    settings.layoutMode === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-white">Spacing</h3>
              <p className="text-sm text-gray-400">Adjust UI density and padding</p>
            </div>
            <select
              value={settings.compactMode}
              onChange={(e) => updateSetting('compactMode', e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
            >
              <option value="compact">Compact (minimal spacing)</option>
              <option value="comfortable">Comfortable (balanced)</option>
              <option value="spacious">Spacious (maximum spacing)</option>
            </select>
          </div>
        </div>

        {/* ===== SECTION 3: TYPOGRAPHY ===== */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Type size={24} className="text-amber-400" />
            <span>Typography</span>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-white">Font Size</h3>
              <p className="text-sm text-gray-400">Adjust text size for readability</p>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
            >
              <option value="small">Small</option>
              <option value="normal">Normal (default)</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Dyslexia-Friendly Font */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.dyslexiaFriendly}
              onChange={(e) => updateSetting('dyslexiaFriendly', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Dyslexia-Friendly Font</h3>
              <p className="text-sm text-gray-400">Use OpenDyslexic font for better readability</p>
            </div>
          </label>
        </div>

        {/* ===== SECTION 4: PERFORMANCE ===== */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Zap size={24} className="text-yellow-400" />
            <span>Performance</span>
          </div>

          {/* Reduce Animations */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.reduceAnimations}
              onChange={(e) => updateSetting('reduceAnimations', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Reduce Animations</h3>
              <p className="text-sm text-gray-400">Disable animations for better performance & accessibility</p>
            </div>
          </label>

          {/* Low Quality Images */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.lowQualityImages}
              onChange={(e) => updateSetting('lowQualityImages', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Low Quality Images</h3>
              <p className="text-sm text-gray-400">Reduce image quality for faster loading</p>
            </div>
          </label>
        </div>

        {/* ===== SECTION 5: DINOSAUR DISPLAY ===== */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Eye size={24} className="text-green-400" />
            <span>Dinosaur Display</span>
          </div>

          {/* Default Sort */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-white">Default Sort</h3>
              <p className="text-sm text-gray-400">How to sort dinosaurs by default</p>
            </div>
            <select
              value={settings.defaultSort}
              onChange={(e) => updateSetting('defaultSort', e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
            >
              <option value="name">By Name (A-Z)</option>
              <option value="period">By Period (Triassic → Cretaceous)</option>
              <option value="size">By Size (Smallest → Largest)</option>
              <option value="diet">By Diet (Herbivore → Carnivore)</option>
            </select>
          </div>

          {/* Wikipedia Links */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.showWikipediaLinks}
              onChange={(e) => updateSetting('showWikipediaLinks', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Show Wikipedia Links</h3>
              <p className="text-sm text-gray-400">Display Wikipedia reference section on dinosaur pages</p>
            </div>
          </label>

          {/* AI Suggestions */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.showAISuggestions}
              onChange={(e) => updateSetting('showAISuggestions', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Show AI Suggestions</h3>
              <p className="text-sm text-gray-400">Display DinoBot AI Assistant on pages</p>
            </div>
          </label>

          {/* Achievements */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.showAchievements}
              onChange={(e) => updateSetting('showAchievements', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">Show Achievements</h3>
              <p className="text-sm text-gray-400">Display achievement badges and progress</p>
            </div>
          </label>
        </div>

        {/* ===== SECTION 6: ACCESSIBILITY ===== */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
            <Accessibility size={24} className="text-cyan-400" />
            <span>Accessibility</span>
          </div>

          {/* High Contrast */}
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-3 rounded-lg transition">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <div>
              <h3 className="font-semibold text-white">High Contrast</h3>
              <p className="text-sm text-gray-400">Increase contrast for better visibility</p>
            </div>
          </label>
        </div>

        {/* ===== RESET BUTTON ===== */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition border border-gray-600 hover:border-gray-500"
          >
            <RotateCcw size={18} />
            Reset to Defaults
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-400 flex items-center gap-2 px-4 py-3">
            <Check size={18} className="text-green-400" />
            Settings saved automatically
          </div>
        </div>
      </div>
    </div>
  )
}
