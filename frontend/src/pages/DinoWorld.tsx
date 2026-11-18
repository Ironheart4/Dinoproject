import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Globe2, Sparkles } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function DinoWorld() {
  useDocumentTitle('Dino World', ' — DinoProject')

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8">
      <div className="w-full max-w-2xl text-center">
        <div className="relative mx-auto mb-8 w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl animate-pulse" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-green-500/30 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg shadow-green-500/10">
            <Globe2 size={56} className="text-green-400" aria-hidden="true" />
            <Sparkles size={18} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-4">
          Dino World
        </h1>

        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium">
          <Compass size={16} className="animate-spin-slow" aria-hidden="true" />
          In development
        </div>

        <p className="text-gray-400 max-w-lg mx-auto mb-8">
          An interactive dinosaur world is on the way. Explore habitats, migrations, and prehistoric
          ecosystems in one immersive map.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/encyclopedia"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
          >
            <Globe2 size={18} aria-hidden="true" />
            Browse Encyclopedia
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-700 bg-gray-800/70 text-gray-200 font-medium hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back Home
          </Link>
        </div>
      </div>
    </div>
  )
}
