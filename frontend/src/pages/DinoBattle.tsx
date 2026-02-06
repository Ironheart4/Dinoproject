// DinoBattle.tsx — Epic Dinosaur Battle Arena
// ============================================
// PURPOSE: Interactive battle simulator where users pit two dinosaurs against each other
// FEATURES:
// - Select any two dinosaurs from the encyclopedia
// - Auto-calculated battle stats based on diet, size, and weight
// - Round-by-round combat simulation with animated log
// - Winner announcement with shareable results
// 
// ALGORITHM:
// - Stats derived from: diet type (carnivore/herbivore/omnivore), length, weight
// - Combat uses: attack, defense, speed (determines first strike), intelligence, ferocity
// - Critical hits possible based on speed stat
// - Battle ends when one dino reaches 0 HP or after 10 rounds
//
// ROUTE: /battle
// DEPENDENCIES: framer-motion (animations), react-icons (icons)
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GiDinosaurRex, GiSwordClash, GiTrophy, GiHealthNormal, GiSpeedometer, GiBrain, GiLightningStorm } from 'react-icons/gi'
import { FaArrowLeft, FaRandom, FaStar } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { api, fetchDinos } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import SocialShare from '../components/SocialShare'

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Dinosaur data structure from API */
interface Dinosaur {
  id: number
  name: string
  species: string
  era: string
  diet: string           // 'Carnivorous', 'Herbivorous', 'Omnivorous'
  length?: number        // meters
  weight?: number        // kg
  height?: number        // meters
  description?: string
  image_url?: string     // URL to dinosaur image
}

/** Calculated battle statistics for a dinosaur */
interface BattleStats {
  attack: number         // 10-100: Damage dealing capability
  defense: number        // 10-100: Damage reduction
  speed: number          // 10-100: Determines turn order, crit chance
  intelligence: number   // 10-100: Random factor for unpredictability
  ferocity: number       // 10-100: Aggression bonus to damage
  total: number          // Sum of all stats for power rating
}

// ============================================
// BATTLE CALCULATION FUNCTIONS
// ============================================

/**
 * calculateBattleStats - Converts dinosaur attributes into battle statistics
 * @param dino - The dinosaur to calculate stats for
 * @returns BattleStats object with attack, defense, speed, intelligence, ferocity
 * 
 * FORMULA:
 * - Carnivores: High attack (30) + ferocity (35), low defense (15)
 * - Herbivores: Low attack (10), high defense (35), minimal ferocity (5)
 * - Omnivores: Balanced stats (20/25/15)
 * - Size bonuses: Larger = more attack/defense, slower speed
 */
function calculateBattleStats(dino: Dinosaur): BattleStats {
  // Base stat modifiers by diet type
  const dietModifiers: Record<string, { attack: number; defense: number; ferocity: number }> = {
    carnivore: { attack: 30, defense: 15, ferocity: 35 },
    herbivore: { attack: 10, defense: 35, ferocity: 5 },
    omnivore: { attack: 20, defense: 25, ferocity: 15 },
  }
  
  // Normalize diet string and get modifiers
  const diet = (dino.diet || 'herbivore').toLowerCase()
  const mod = dietModifiers[diet] || dietModifiers.herbivore
  
  // Size-based stats (normalized to 0-100 scale)
  const lengthScore = Math.min(100, (dino.length || 5) * 2.5)   // 40m max = 100
  const weightScore = Math.min(100, (dino.weight || 500) / 100) // 10000kg max = 100
  
  // Calculate individual stats with modifiers
  const attack = Math.round(mod.attack + lengthScore * 0.3 + weightScore * 0.2)
  const defense = Math.round(mod.defense + weightScore * 0.4)
  const speed = Math.round(100 - weightScore * 0.5 + (diet === 'carnivore' ? 20 : 0))
  const intelligence = Math.round(30 + Math.random() * 40) // Random 30-70 for variety
  const ferocity = Math.round(mod.ferocity + (diet === 'carnivore' ? lengthScore * 0.2 : 0))
  
  // Total power rating
  const total = attack + defense + speed + intelligence + ferocity
  
  // Clamp all values between 10-100
  return {
    attack: Math.min(100, Math.max(10, attack)),
    defense: Math.min(100, Math.max(10, defense)),
    speed: Math.min(100, Math.max(10, speed)),
    intelligence: Math.min(100, Math.max(10, intelligence)),
    ferocity: Math.min(100, Math.max(10, ferocity)),
    total
  }
}

/**
 * simulateBattle - Runs a complete battle simulation between two dinosaurs
 * @param dino1 - First fighter
 * @param dino2 - Second fighter
 * @param stats1 - Pre-calculated stats for fighter 1
 * @param stats2 - Pre-calculated stats for fighter 2
 * @returns Battle result with rounds array, winner, final HP, victory type
 */
function simulateBattle(dino1: Dinosaur, dino2: Dinosaur, stats1: BattleStats, stats2: BattleStats) {
  const rounds: { round: number; attacker: string; action: string; damage: number; winner?: string }[] = []
  let hp1 = 100  // Fighter 1 health points
  let hp2 = 100  // Fighter 2 health points
  let round = 0
  
  // Faster dinosaur attacks first
  let firstAttacker = stats1.speed >= stats2.speed ? 1 : 2
  
  // Combat loop - max 10 rounds to prevent infinite battles
  while (hp1 > 0 && hp2 > 0 && round < 10) {
    round++
    // Alternate attackers, starting with the faster one
    const attacker = round % 2 === 1 ? firstAttacker : (firstAttacker === 1 ? 2 : 1)
    const attackerStats = attacker === 1 ? stats1 : stats2
    const defenderStats = attacker === 1 ? stats2 : stats1
    const attackerName = attacker === 1 ? dino1.name : dino2.name
    
    // Damage calculation: base damage - defense + random variance
    const baseDamage = attackerStats.attack * 0.5 + attackerStats.ferocity * 0.3
    const defense = defenderStats.defense * 0.3
    const critChance = attackerStats.speed / 200  // Max 50% crit chance
    const isCrit = Math.random() < critChance
    
    let damage = Math.max(5, Math.round(baseDamage - defense + (Math.random() * 10)))
    if (isCrit) damage = Math.round(damage * 1.5)  // Critical hits deal 1.5x damage
    
    // Flavor text for attacks based on diet
    const actions = {
      carnivore: ['unleashes a devastating bite', 'slashes with razor claws', 'charges ferociously', 'delivers a crushing blow'],
      herbivore: ['swings its mighty tail', 'charges with its head down', 'stomps the ground', 'defends with its armored body'],
      omnivore: ['strikes with surprising force', 'outmaneuvers and attacks', 'uses tactical aggression', 'delivers a calculated blow']
    }
    
    const diet = (attacker === 1 ? dino1.diet : dino2.diet)?.toLowerCase() || 'herbivore'
    const actionList = actions[diet as keyof typeof actions] || actions.herbivore
    const action = actionList[Math.floor(Math.random() * actionList.length)]
    
    if (attacker === 1) {
      hp2 -= damage
    } else {
      hp1 -= damage
    }
    
    rounds.push({
      round,
      attacker: attackerName,
      action: `${attackerName} ${action}${isCrit ? ' (CRITICAL HIT!)' : ''}`,
      damage
    })
  }
  
  const winner = hp1 > hp2 ? dino1 : dino2
  const loser = hp1 > hp2 ? dino2 : dino1
  const winnerStats = hp1 > hp2 ? stats1 : stats2
  
  // Victory message based on how dominant the win was
  const hpDiff = Math.abs(hp1 - hp2)
  let victoryType = 'narrow'
  if (hpDiff > 50) victoryType = 'dominant'
  else if (hpDiff > 25) victoryType = 'decisive'
  
  return {
    winner,
    loser,
    rounds,
    finalHp: { hp1: Math.max(0, hp1), hp2: Math.max(0, hp2) },
    victoryType,
    winnerStats
  }
}

// Stat bar component
function StatBar({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1 text-gray-400">
          <Icon className="w-4 h-4" /> {label}
        </span>
        <span className="text-white font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

// Dinosaur selection card
function DinoSelectCard({ dino, selected, onSelect, stats }: { 
  dino: Dinosaur; 
  selected: boolean; 
  onSelect: () => void;
  stats: BattleStats
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
        selected 
          ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-4">
        {dino.image_url ? (
          <img 
            src={dino.image_url} 
            alt={dino.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center">
            <GiDinosaurRex className="w-8 h-8 text-gray-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{dino.name}</h3>
          <p className="text-sm text-gray-400 truncate">{dino.species}</p>
          <div className="flex gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              dino.diet?.toLowerCase() === 'carnivore' 
                ? 'bg-red-500/20 text-red-400' 
                : dino.diet?.toLowerCase() === 'herbivore'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {dino.diet}
            </span>
            <span className="text-xs text-gray-500">Power: {stats.total}</span>
          </div>
        </div>
        {selected && (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <FaStar className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function DinoBattle() {
  useDocumentTitle('Dino Battle Arena')
  
  const [dinosaurs, setDinosaurs] = useState<Dinosaur[]>([])
  const [loading, setLoading] = useState(true)
  const [fighter1, setFighter1] = useState<Dinosaur | null>(null)
  const [fighter2, setFighter2] = useState<Dinosaur | null>(null)
  const [battleResult, setBattleResult] = useState<ReturnType<typeof simulateBattle> | null>(null)
  const [showingRounds, setShowingRounds] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [battleStarted, setBattleStarted] = useState(false)

  // Fetch dinosaurs
  useEffect(() => {
    async function loadDinos() {
      try {
        const data = await fetchDinos()
        setDinosaurs(data)
      } catch (err) {
        console.error('Failed to fetch dinosaurs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDinos()
  }, [])

  // Calculate stats for selected fighters
  const stats1 = useMemo(() => fighter1 ? calculateBattleStats(fighter1) : null, [fighter1])
  const stats2 = useMemo(() => fighter2 ? calculateBattleStats(fighter2) : null, [fighter2])

  // Random selection
  function selectRandom() {
    if (dinosaurs.length < 2) return
    const shuffled = [...dinosaurs].sort(() => Math.random() - 0.5)
    setFighter1(shuffled[0])
    setFighter2(shuffled[1])
    setBattleResult(null)
    setBattleStarted(false)
  }

  // Start battle
  function startBattle() {
    if (!fighter1 || !fighter2 || !stats1 || !stats2) return
    const result = simulateBattle(fighter1, fighter2, stats1, stats2)
    setBattleResult(result)
    setBattleStarted(true)
    setShowingRounds(true)
    setCurrentRound(0)
    
    // Animate through rounds
    result.rounds.forEach((_, i) => {
      setTimeout(() => setCurrentRound(i + 1), (i + 1) * 800)
    })
  }

  // Reset battle
  function resetBattle() {
    setFighter1(null)
    setFighter2(null)
    setBattleResult(null)
    setBattleStarted(false)
    setShowingRounds(false)
    setCurrentRound(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <GiSwordClash className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
          <p className="text-gray-400 mt-4">Loading fighters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/home" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <FaArrowLeft /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            <span className="text-green-500">DINO</span> BATTLE ARENA
          </h1>
          <p className="text-gray-400">Choose your fighters and watch them clash!</p>
        </div>

        {!battleStarted ? (
          <>
            {/* Fighter Selection */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Fighter 1 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm">1</span>
                  Fighter 1
                </h2>
                {fighter1 && stats1 ? (
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-blue-500">
                    <div className="flex items-center gap-4 mb-4">
                      {fighter1.image_url ? (
                        <img src={fighter1.image_url} alt={fighter1.name} className="w-24 h-24 rounded-xl object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-700 flex items-center justify-center">
                          <GiDinosaurRex className="w-12 h-12 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-white">{fighter1.name}</h3>
                        <p className="text-gray-400">{fighter1.species}</p>
                        <p className="text-sm text-yellow-400">Power: {stats1.total}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <StatBar label="Attack" value={stats1.attack} color="bg-red-500" icon={GiLightningStorm} />
                      <StatBar label="Defense" value={stats1.defense} color="bg-blue-500" icon={GiHealthNormal} />
                      <StatBar label="Speed" value={stats1.speed} color="bg-yellow-500" icon={GiSpeedometer} />
                      <StatBar label="Intelligence" value={stats1.intelligence} color="bg-purple-500" icon={GiBrain} />
                      <StatBar label="Ferocity" value={stats1.ferocity} color="bg-orange-500" icon={GiSwordClash} />
                    </div>
                    <button onClick={() => setFighter1(null)} className="mt-4 text-sm text-red-400 hover:text-red-300">
                      Change Fighter
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 rounded-2xl p-8 border-2 border-dashed border-gray-700 text-center">
                    <GiDinosaurRex className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Select Fighter 1 below</p>
                  </div>
                )}
              </div>

              {/* VS */}
              <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 top-1/3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <span className="text-2xl font-black text-white">VS</span>
                </div>
              </div>

              {/* Fighter 2 */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-sm">2</span>
                  Fighter 2
                </h2>
                {fighter2 && stats2 ? (
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-red-500">
                    <div className="flex items-center gap-4 mb-4">
                      {fighter2.image_url ? (
                        <img src={fighter2.image_url} alt={fighter2.name} className="w-24 h-24 rounded-xl object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-700 flex items-center justify-center">
                          <GiDinosaurRex className="w-12 h-12 text-red-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-white">{fighter2.name}</h3>
                        <p className="text-gray-400">{fighter2.species}</p>
                        <p className="text-sm text-yellow-400">Power: {stats2.total}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <StatBar label="Attack" value={stats2.attack} color="bg-red-500" icon={GiLightningStorm} />
                      <StatBar label="Defense" value={stats2.defense} color="bg-blue-500" icon={GiHealthNormal} />
                      <StatBar label="Speed" value={stats2.speed} color="bg-yellow-500" icon={GiSpeedometer} />
                      <StatBar label="Intelligence" value={stats2.intelligence} color="bg-purple-500" icon={GiBrain} />
                      <StatBar label="Ferocity" value={stats2.ferocity} color="bg-orange-500" icon={GiSwordClash} />
                    </div>
                    <button onClick={() => setFighter2(null)} className="mt-4 text-sm text-red-400 hover:text-red-300">
                      Change Fighter
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 rounded-2xl p-8 border-2 border-dashed border-gray-700 text-center">
                    <GiDinosaurRex className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Select Fighter 2 below</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <button
                onClick={selectRandom}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
              >
                <FaRandom /> Random Matchup
              </button>
              {fighter1 && fighter2 && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={startBattle}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-orange-600 transition shadow-lg shadow-red-500/30"
                >
                  <GiSwordClash className="w-5 h-5" /> START BATTLE!
                </motion.button>
              )}
            </div>

            {/* Dinosaur selection grid */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Choose Your Fighters</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {dinosaurs.map((dino) => {
                  const dinoStats = calculateBattleStats(dino)
                  const isSelected1 = fighter1?.id === dino.id
                  const isSelected2 = fighter2?.id === dino.id
                  return (
                    <DinoSelectCard
                      key={dino.id}
                      dino={dino}
                      stats={dinoStats}
                      selected={isSelected1 || isSelected2}
                      onSelect={() => {
                        if (isSelected1) {
                          setFighter1(null)
                        } else if (isSelected2) {
                          setFighter2(null)
                        } else if (!fighter1) {
                          setFighter1(dino)
                        } else if (!fighter2) {
                          setFighter2(dino)
                        }
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          // Battle Results View
          <AnimatePresence>
            {battleResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Battle rounds */}
                {showingRounds && (
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <GiSwordClash className="text-red-500" /> Battle Log
                    </h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {battleResult.rounds.slice(0, currentRound).map((round, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
                        >
                          <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                            {round.round}
                          </span>
                          <span className="flex-1 text-gray-300">{round.action}</span>
                          <span className="text-red-400 font-bold">-{round.damage} HP</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Winner announcement */}
                {currentRound >= battleResult.rounds.length && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="inline-block mb-6">
                      <GiTrophy className="w-24 h-24 text-yellow-500 mx-auto animate-bounce" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                      {battleResult.winner.name} WINS!
                    </h2>
                    <p className="text-gray-400 mb-6">
                      {battleResult.victoryType === 'dominant' && 'A dominant victory! Not even close.'}
                      {battleResult.victoryType === 'decisive' && 'A decisive win by the champion!'}
                      {battleResult.victoryType === 'narrow' && 'A nail-biter that could have gone either way!'}
                    </p>

                    {/* Final HP bars */}
                    <div className="max-w-md mx-auto space-y-4 mb-8">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">{fighter1?.name}</span>
                          <span className="text-gray-400">{battleResult.finalHp.hp1} HP</span>
                        </div>
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              battleResult.winner.id === fighter1?.id ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${battleResult.finalHp.hp1}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">{fighter2?.name}</span>
                          <span className="text-gray-400">{battleResult.finalHp.hp2} HP</span>
                        </div>
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              battleResult.winner.id === fighter2?.id ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${battleResult.finalHp.hp2}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Share results */}
                    <div className="mb-8">
                      <SocialShare
                        title="Dino Battle Results"
                        text={`${battleResult.winner.name} defeated ${battleResult.loser.name} in an epic dinosaur battle! 🦖 Try it yourself at DinoProject!`}
                        variant="buttons"
                        className="justify-center"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-4 justify-center">
                      <button
                        onClick={() => {
                          setBattleStarted(false)
                          setBattleResult(null)
                          startBattle()
                        }}
                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
                      >
                        Rematch!
                      </button>
                      <button
                        onClick={resetBattle}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition"
                      >
                        New Battle
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
