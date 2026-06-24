// SearchBar.tsx — Global search component with autocomplete
// Features: Search dinosaurs and quizzes, autocomplete dropdown, keyboard navigation
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

interface SearchResult {
  id: number
  name?: string
  title?: string
  type: 'dinosaur' | 'quiz'
  species?: string
  period?: string
  diet?: string
  imageUrl?: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Search on query change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch()
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/search', { params: { q: query } })
      const allResults = [
        ...res.data.results.dinosaurs,
        ...res.data.results.quizzes,
      ]
      setResults(allResults)
      setIsOpen(true)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'dinosaur') {
      navigate(`/dino/${result.id}`)
    } else if (result.type === 'quiz') {
      navigate(`/quiz/${result.id}`)
    }
    setQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full md:w-64 lg:w-80">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search dinosaurs, quizzes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Dinosaurs Section */}
          {results.filter(r => r.type === 'dinosaur').length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/50 sticky top-0">
                Dinosaurs
              </div>
              {results
                .filter(r => r.type === 'dinosaur')
                .map((result, idx) => (
                  <button
                    key={`dino-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      selectedIndex === results.indexOf(result)
                        ? 'bg-green-600/20 border-l-2 border-green-400'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    {result.imageUrl && (
                      <img
                        src={result.imageUrl}
                        alt={result.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-green-400 truncate">
                        {result.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {result.species && `${result.species} • `}
                        {result.period} • {result.diet}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {/* Quizzes Section */}
          {results.filter(r => r.type === 'quiz').length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-900/50 sticky top-0">
                Quizzes
              </div>
              {results
                .filter(r => r.type === 'quiz')
                .map((result, idx) => (
                  <button
                    key={`quiz-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      selectedIndex === results.indexOf(result)
                        ? 'bg-blue-600/20 border-l-2 border-blue-400'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded bg-blue-600/20 flex items-center justify-center">
                      <span className="text-blue-400 font-bold">?</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-blue-400 truncate">
                        {result.title}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 flex items-center justify-center gap-2 z-50">
          <Loader2 size={18} className="animate-spin text-green-400" />
          <span className="text-gray-300 text-sm">Searching...</span>
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-400 text-sm z-50">
          No dinosaurs or quizzes found
        </div>
      )}
    </div>
  )
}
