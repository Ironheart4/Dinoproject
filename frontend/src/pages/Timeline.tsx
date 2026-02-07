// Timeline.tsx — Timeline explorer with geographic mapping
// Notes:
// - Uses OpenLayers to render dinosaur locations inferred from `livedIn` text
// - Groups dinosaurs by time period and allows searching, hovering, and navigation to details
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Clock, Calendar, Loader2, Search, X, MapPin } from 'lucide-react' 

// OpenLayers imports
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import { Style, Circle, Fill, Stroke, Text } from 'ol/style'
import Overlay from 'ol/Overlay'
import 'ol/ol.css'

interface Dinosaur {
  id: number
  name: string
  species: string
  period: string | null
  diet: string | null
  livedIn: string | null
  lengthMeters: number | string | null
  weightKg: number | null
  taxonomy: string | null
  imageUrl1: string | null
}

interface TimePeriod {
  name: string
  years: string
  color: string
  bgClass: string
}

const TIME_PERIODS: TimePeriod[] = [
  { name: 'Triassic', years: '252-201 MYA', color: '#E74C3C', bgClass: 'bg-red-500' },
  { name: 'Jurassic', years: '201-145 MYA', color: '#3498DB', bgClass: 'bg-blue-500' },
  { name: 'Cretaceous', years: '145-66 MYA', color: '#27AE60', bgClass: 'bg-green-500' },
]

// Region coordinates mapping [longitude, latitude]
const REGION_COORDINATES: Record<string, [number, number]> = {
  'north america': [-100, 45], 'usa': [-98, 39], 'united states': [-98, 39],
  'canada': [-106, 56], 'mexico': [-102, 23], 'montana': [-110, 47],
  'utah': [-111, 39], 'colorado': [-105, 39], 'wyoming': [-107, 43],
  'alberta': [-115, 53], 'new mexico': [-106, 34], 'texas': [-100, 31],
  'south america': [-60, -15], 'argentina': [-63, -38], 'brazil': [-51, -14],
  'chile': [-71, -35], 'patagonia': [-70, -45],
  'europe': [10, 50], 'england': [-1, 52], 'uk': [-2, 54],
  'germany': [10, 51], 'france': [2, 46], 'spain': [-4, 40],
  'portugal': [-8, 39], 'belgium': [4, 50], 'romania': [25, 46],
  'africa': [20, 5], 'egypt': [30, 26], 'morocco': [-5, 32],
  'tanzania': [35, -6], 'niger': [8, 17], 'madagascar': [47, -19],
  'south africa': [25, -30],
  'asia': [105, 35], 'china': [105, 35], 'mongolia': [105, 46],
  'gobi': [105, 43], 'japan': [138, 36], 'india': [78, 20],
  'thailand': [100, 15], 'kazakhstan': [67, 48],
  'australia': [133, -25], 'queensland': [145, -20],
  'antarctica': [0, -75],
}

// Map inference helper: tries to map free-text `livedIn` values to approximate [lng, lat].
// Returns null for unknown locations. The `seed` adds small offsets to prevent marker overlap.
function getCoordinates(livedIn: string | null, seed: number = 0): [number, number] | null {
  if (!livedIn) return null
  const lower = livedIn.toLowerCase()
  
  for (const [region, coords] of Object.entries(REGION_COORDINATES)) {
    if (lower.includes(region)) {
      // Slight offset based on seed to prevent stacking
      const offsetLng = ((seed * 7) % 10) * 0.8 - 4
      const offsetLat = ((seed * 11) % 10) * 0.8 - 4
      return [coords[0] + offsetLng, coords[1] + offsetLat]
    }
  }
  
  return null
}

function getPeriodInfo(period: string | null): TimePeriod {
  if (!period) return { name: 'Unknown', years: '', color: '#888888', bgClass: 'bg-gray-500' }
  const lower = period.toLowerCase()
  if (lower.includes('triassic')) return TIME_PERIODS[0]
  if (lower.includes('jurassic')) return TIME_PERIODS[1]
  if (lower.includes('cretaceous')) return TIME_PERIODS[2]
  return { name: 'Unknown', years: '', color: '#888888', bgClass: 'bg-gray-500' }
}

export default function Timeline() {
  useDocumentTitle('Timeline Explorer', ' — DinoProject')
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<Overlay | null>(null)
  
  const [dinosaurs, setDinosaurs] = useState<Dinosaur[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [hoveredDino, setHoveredDino] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<Dinosaur | null>(null)
  const [blinkingDino, setBlinkingDino] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [popupContent, setPopupContent] = useState<Dinosaur | null>(null)

  // Fetch dinosaurs
  useEffect(() => {
    console.log('Fetching dinosaurs...')
    api.get('/api/dinosaurs')
      .then(res => {
        console.log('Fetched dinosaurs:', res.data.length, res.data)
        setDinosaurs(res.data)
      })
      .catch(err => {
        console.error('Failed to fetch dinosaurs:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Filter dinosaurs
  const filteredDinos = useMemo(() => {
    return dinosaurs.filter(d => {
      if (!selectedPeriod) return true
      return d.period?.toLowerCase().includes(selectedPeriod.toLowerCase())
    })
  }, [dinosaurs, selectedPeriod])

  // Group by period for timeline
  const groupedByPeriod = useMemo(() => {
    const groups: Record<string, Dinosaur[]> = {
      Triassic: [], Jurassic: [], Cretaceous: [], Unknown: []
    }
    filteredDinos.forEach(d => {
      const period = getPeriodInfo(d.period).name
      if (groups[period]) groups[period].push(d)
      else groups.Unknown.push(d)
    })
    return groups
  }, [filteredDinos])

  // Mappable dinosaurs
  const mappableDinos = useMemo(() => {
    return filteredDinos
      .map((d, i) => ({ ...d, coords: getCoordinates(d.livedIn, i) }))
      .filter(d => d.coords !== null) as (Dinosaur & { coords: [number, number] })[]
  }, [filteredDinos])

  // Initialize OpenLayers Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create vector source for markers
    const vectorSource = new VectorSource()
    vectorSourceRef.current = vectorSource

    // Create vector layer for markers
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    })

    // Create the map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
    })

    // Create popup overlay
    if (popupRef.current) {
      const overlay = new Overlay({
        element: popupRef.current,
        autoPan: true,
        positioning: 'bottom-center',
        offset: [0, -10],
      })
      map.addOverlay(overlay)
      overlayRef.current = overlay
    }

    // Handle map click
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
      if (feature) {
        const dinoId = feature.get('dinoId')
        if (dinoId) {
          navigate(`/dino/${dinoId}`)
        }
      }
    })

    // Handle pointer move for hover - keep popup visible
    let hideTimeout: ReturnType<typeof setTimeout> | null = null
    
    map.on('pointermove', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
      const target = map.getTarget() as HTMLElement
      target.style.cursor = feature ? 'pointer' : ''
      
      if (feature && overlayRef.current && popupRef.current) {
        // Clear any pending hide timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout)
          hideTimeout = null
        }
        
        const dinoId = feature.get('dinoId')
        const dino = dinosaurs.find(d => d.id === dinoId)
        if (dino) {
          setPopupContent(dino)
          overlayRef.current.setPosition(evt.coordinate)
          popupRef.current.style.display = 'block'
        }
      }
    })
    
    // Hide popup when mouse leaves the map container
    const mapContainer = mapRef.current
    if (mapContainer) {
      mapContainer.addEventListener('mouseleave', () => {
        if (popupRef.current) {
          popupRef.current.style.display = 'none'
          setPopupContent(null)
        }
      })
    }

    mapInstanceRef.current = map

    return () => {
      map.setTarget(undefined)
      mapInstanceRef.current = null
    }
  }, [navigate, dinosaurs])

  // Update markers when data changes
  useEffect(() => {
    if (!vectorSourceRef.current) return

    // Clear existing features
    vectorSourceRef.current.clear()

    console.log('Adding markers for', mappableDinos.length, 'dinosaurs')

    // Add new features
    mappableDinos.forEach((dino) => {
      const periodInfo = getPeriodInfo(dino.period)
      
      const feature = new Feature({
        geometry: new Point(fromLonLat(dino.coords)),
        dinoId: dino.id,
        dinoName: dino.name,
      })

      // Create style
      const isBlinking = blinkingDino === dino.id
      const isHovered = hoveredDino === dino.id
      
      feature.setStyle(new Style({
        image: new Circle({
          radius: isHovered || isBlinking ? 14 : 10,
          fill: new Fill({ color: periodInfo.color }),
          stroke: new Stroke({
            color: isBlinking ? '#22c55e' : '#ffffff',
            width: isBlinking ? 4 : 2,
          }),
        }),
        text: new Text({
          text: dino.name.substring(0, 2).toUpperCase(),
          fill: new Fill({ color: '#ffffff' }),
          font: 'bold 10px sans-serif',
        }),
      }))

      vectorSourceRef.current!.addFeature(feature)
    })
  }, [mappableDinos, blinkingDino, hoveredDino])

  // Handle blinking effect
  useEffect(() => {
    if (blinkingDino === null) return

    const interval = setInterval(() => {
      // Force re-render to toggle blink
      vectorSourceRef.current?.changed()
    }, 300)

    const timeout = setTimeout(() => {
      setBlinkingDino(null)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [blinkingDino])

  // Search handler
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    const found = dinosaurs.find(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.species.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (found) {
      setSearchResult(found)
      setBlinkingDino(found.id)
      
      const coords = getCoordinates(found.livedIn, found.id)
      if (coords && mapInstanceRef.current) {
        mapInstanceRef.current.getView().animate({
          center: fromLonLat(coords),
          zoom: 5,
          duration: 1000,
        })
      }
    } else {
      setSearchResult(null)
      alert('Dinosaur not found. Try another name.')
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResult(null)
    setBlinkingDino(null)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([0, 20]),
        zoom: 2,
        duration: 1000,
      })
    }
  }

  // Handle dino click
  const handleDinoClick = (dino: Dinosaur) => {
    navigate(`/dino/${dino.id}`)
  }

  // Handle timeline hover - fly to location when hovering timeline icons
  const handleTimelineHover = (dino: Dinosaur | null) => {
    setHoveredDino(dino ? dino.id : null)
    
    // Fly to dino location on the map when hovering timeline icons
    if (dino && mapInstanceRef.current) {
      const coords = getCoordinates(dino.livedIn, dino.id)
      if (coords) {
        mapInstanceRef.current.getView().animate({
          center: fromLonLat(coords),
          zoom: 4,
          duration: 800,
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-green-400" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold font-display text-primary flex items-center gap-2 sm:gap-3">
            <Calendar className="text-green-400" /> Timeline Explorer
          </h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Explore {dinosaurs.length} dinosaurs across time and space
          </p>
        </div>
        
        {/* Current Time */}
        <div className="flex items-center gap-2 bg-gray-800 px-3 sm:px-4 py-2 rounded-xl border border-gray-700 w-fit">
          <Clock className="text-green-400" size={18} />
          <div className="text-right">
            <div className="text-xs text-gray-400">Your Time</div>
            <div className="text-base sm:text-lg font-mono text-white">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        <span className="text-gray-400 text-xs sm:text-sm">Filter:</span>
        <button
          onClick={() => setSelectedPeriod(null)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
            !selectedPeriod ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Periods
        </button>
        {TIME_PERIODS.map((period) => (
          <button
            key={period.name}
            onClick={() => setSelectedPeriod(selectedPeriod === period.name ? null : period.name)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1 sm:gap-2 ${
              selectedPeriod === period.name 
                ? `${period.bgClass} text-white` 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: period.color }} />
            {period.name}
            <span className="text-xs opacity-70">
              ({groupedByPeriod[period.name]?.length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Horizontal Timeline */}
      <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700">
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">🦕 Geological Timeline</h2>
        {/* Timeline grid - evenly spaced periods */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {TIME_PERIODS.map((period) => (
            <div key={period.name} className="flex flex-col">
              {/* Period Header */}
              <div 
                className="mb-3 px-3 sm:px-4 py-2 rounded-lg text-center"
                style={{ backgroundColor: period.color + '30', borderLeft: `4px solid ${period.color}` }}
              >
                <div className="font-bold text-white text-sm sm:text-base">{period.name}</div>
                <div className="text-xs text-gray-400">{period.years}</div>
              </div>
              
              {/* Dinosaur Icons with scroll when overflow */}
              <div className="flex gap-2 flex-wrap max-h-[200px] overflow-y-auto overflow-x-hidden pr-1" 
                   style={{ scrollbarWidth: 'thin' }}>
                {groupedByPeriod[period.name]?.map((dino) => (
                    <div
                      key={dino.id}
                      className={`relative group cursor-pointer transition-all duration-200 ${
                        hoveredDino === dino.id ? 'scale-110 z-10 ring-2 ring-green-400' : 'hover:scale-105'
                      } ${blinkingDino === dino.id ? 'animate-pulse' : ''}`}
                      onMouseEnter={() => handleTimelineHover(dino)}
                      onMouseLeave={() => handleTimelineHover(null)}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/dino/${dino.id}`)
                      }}
                    >
                      {/* Circular Icon */}
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 bg-gray-700"
                        style={{ borderColor: period.color }}
                      >
                        <img
                          src={dino.imageUrl1 || ''}
                          alt={dino.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl min-w-[180px] border border-gray-700">
                          <div className="font-bold text-green-400">{dino.name}</div>
                          <div className="text-xs text-gray-400 italic mb-2">{dino.species}</div>
                          <div className="space-y-1 text-xs">
                            {dino.lengthMeters && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Length:</span>
                                <span>{dino.lengthMeters}m</span>
                              </div>
                            )}
                            {dino.weightKg && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Weight:</span>
                                <span>{Number(dino.weightKg).toLocaleString()}kg</span>
                              </div>
                            )}
                            {dino.taxonomy && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Family:</span>
                                <span className="truncate ml-1 max-w-[100px]">{dino.taxonomy.split(' ').slice(-1)[0]}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                            Click to view details
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  ))}
                  {(groupedByPeriod[period.name]?.length || 0) === 0 && (
                    <div className="text-gray-500 text-sm">No dinosaurs</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* World Map */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🌍 Discovery Locations
          </h2>
          <div className="text-xs sm:text-sm text-gray-400">
            {mappableDinos.length} dinosaurs mapped
          </div>
        </div>
        <div ref={mapRef} className="h-[300px] sm:h-[400px] lg:h-[500px] w-full" />
        
        {/* Popup */}
        <div 
          ref={popupRef} 
          className="bg-gray-900 text-white p-3 rounded-lg shadow-xl min-w-[180px] border border-gray-700 cursor-pointer hover:border-green-500 transition-colors"
          style={{ display: 'none' }}
          onClick={() => popupContent && navigate(`/dino/${popupContent.id}`)}
        >
          {popupContent && (
            <>
              <div className="font-bold text-green-400">{popupContent.name}</div>
              <div className="text-xs text-gray-400 italic mb-2">{popupContent.species}</div>
              <div className="space-y-1 text-xs">
                {popupContent.lengthMeters && <div>Length: {popupContent.lengthMeters}m</div>}
                {popupContent.weightKg && <div>Weight: {Number(popupContent.weightKg).toLocaleString()}kg</div>}
                {popupContent.livedIn && <div>Location: {popupContent.livedIn}</div>}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                Click to view details →
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Bar - Under the Map */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-3">🔍 Find a Dinosaur on the Map</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Type a dinosaur name (e.g., Aardonyx, Tyrannosaurus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
          >
            Find on Map
          </button>
          {searchResult && (
            <button
              onClick={clearSearch}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              title="Clear search"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {searchResult && (
          <div className="mt-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="text-green-400 flex-shrink-0" size={20} />
              <span className="text-green-400">
                Found <strong>{searchResult.name}</strong> in {searchResult.livedIn || 'Unknown location'} - Look for the blinking marker above!
              </span>
            </div>
            <button
              onClick={() => navigate(`/dino/${searchResult.id}`)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition text-sm whitespace-nowrap"
            >
              View Details
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-wrap gap-6 justify-center text-sm">
          {TIME_PERIODS.map((period) => (
            <div key={period.name} className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full border-2" 
                style={{ borderColor: period.color, background: period.color }}
              />
              <span className="text-gray-300">{period.name}</span>
              <span className="text-gray-500">({period.years})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
