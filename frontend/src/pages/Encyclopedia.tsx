import React, { useEffect, useState, useRef } from 'react'
import { fetchDinos } from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { Dna, Search, Calendar, Globe, Bone, Ruler } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function Encyclopedia() {
  useDocumentTitle('Dinosaur Encyclopedia');
  const navigate = useNavigate()
  const [dinos, setDinos] = useState<any[]>([])
  const [filteredDinos, setFilteredDinos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dietFilter, setDietFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetchDinos()
      .then(data => {
        setDinos(data || [])
        setFilteredDinos(data || [])
      })
      .catch(() => {
        setDinos([])
        setFilteredDinos([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Generate suggestions when typing
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase()
      const matches = dinos
        .filter(d => 
          d.name?.toLowerCase().includes(q) ||
          d.species?.toLowerCase().includes(q)
        )
        .slice(0, 5) // Limit to 5 suggestions
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, dinos])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let result = [...dinos]
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.species?.toLowerCase().includes(q) ||
        d.livedIn?.toLowerCase().includes(q) ||
        d.period?.toLowerCase().includes(q)
      )
    }
    
    // Diet filter
    if (dietFilter) {
      result = result.filter(d => d.diet?.toLowerCase() === dietFilter.toLowerCase())
    }
    
    // Type filter
    if (typeFilter) {
      result = result.filter(d => d.type?.toLowerCase().includes(typeFilter.toLowerCase()))
    }
    
    setFilteredDinos(result)
  }, [searchQuery, dietFilter, typeFilter, dinos])

  // Handle suggestion click
  const handleSuggestionClick = (dino: any) => {
    setShowSuggestions(false)
    navigate(`/dino/${dino.id}`)
  }

  // Get unique types for filter dropdown
  const uniqueTypes = [...new Set(dinos.map(d => d.type).filter(Boolean))]

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2"><Dna className="text-green-400" /> Dinosaur Encyclopedia</h2>
      <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Explore our comprehensive database of prehistoric creatures.</p>
      
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative" ref={searchRef}>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Search by name, species, location, or period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full border border-gray-600 rounded-lg p-3 pl-10 bg-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
          />
          
          {/* Auto-suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
              {suggestions.map((dino) => (
                <button
                  key={dino.id}
                  onClick={() => handleSuggestionClick(dino)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-700 last:border-b-0"
                >
                  <Dna size={16} className="text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium">{dino.name}</div>
                    <div className="text-xs text-gray-400">{dino.species} • {dino.period}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
          <select
            value={dietFilter}
            onChange={(e) => setDietFilter(e.target.value)}
            className="border border-gray-600 rounded-lg p-3 bg-gray-700 text-white text-sm sm:text-base"
          >
            <option value="">All Diets</option>
            <option value="herbivorous">Herbivorous</option>
            <option value="carnivorous">Carnivorous</option>
            <option value="omnivorous">Omnivorous</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-600 rounded-lg p-3 bg-gray-700 text-white text-sm sm:text-base"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        Showing {filteredDinos.length} of {dinos.length} dinosaurs
      </div>
      
      {loading && <p className="text-gray-400">Loading dinosaurs...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredDinos.map(d => {
          const imageUrl = d.imageUrl1 || d.imageUrl
          const hasImage = imageUrl && imageUrl !== 'DEV_PENDING'
          
          return (
            <Link key={d.id} to={`/dino/${d.id}`}>
              <div className="bg-gray-800 border border-gray-700 rounded-lg hover:border-green-500 transition h-full overflow-hidden flex flex-col">
                {/* Image */}
                <div className="h-40 sm:h-48 bg-gray-900 flex items-center justify-center overflow-hidden relative">
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={d.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-opacity duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Dna size={64} className="text-gray-500" />
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{d.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.diet === 'carnivorous' ? 'bg-red-900 text-red-300' :
                      d.diet === 'herbivorous' ? 'bg-green-900 text-green-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {d.diet || 'Unknown'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 italic mb-3">{d.species}</p>
                  
                  <div className="space-y-1 text-xs text-gray-400 flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Calendar size={10} /> Period:</span>
                      <span className="text-gray-300 text-right max-w-[60%] truncate">{d.period?.split(' ')[0] || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Globe size={10} /> Lived In:</span>
                      <span className="text-gray-300">{d.livedIn || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Bone size={10} /> Type:</span>
                      <span className="text-gray-300">{d.type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Ruler size={10} /> Length:</span>
                      <span className="text-gray-300">{d.lengthMeters ? `${d.lengthMeters}m` : 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <span className="text-green-400 font-semibold text-sm hover:text-green-300">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {!loading && filteredDinos.length === 0 && (
        <div className="text-center py-12">
          <Search size={64} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">No dinosaurs found matching your criteria.</p>
          <button
            onClick={() => { setSearchQuery(''); setDietFilter(''); setTypeFilter('') }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
