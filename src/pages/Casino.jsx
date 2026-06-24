import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bomb, TrendingUp, Dices, CircleDashed, Zap, Circle,
  ArrowUpDown, Grid3x3, Spade, CircleDot, Layers, CreditCard,
  Search, SlidersHorizontal,
} from 'lucide-react'

const GAMES = [
  { path: '/games/mines', label: 'Mines', icon: Bomb, tag: 'Original', color: '#ef4444', desc: 'Uncover gems, dodge mines', rtp: '99%', players: 1240 },
  { path: '/games/crash', label: 'Crash', icon: TrendingUp, tag: 'Original', color: '#22c55e', desc: 'Cash out before the crash', rtp: '99%', players: 3401 },
  { path: '/games/dice', label: 'Dice', icon: Dices, tag: 'Original', color: '#3b82f6', desc: 'Roll the dice your way', rtp: '99%', players: 892 },
  { path: '/games/plinko', label: 'Plinko', icon: CircleDashed, tag: 'Original', color: '#a855f7', desc: 'Drop balls for multipliers', rtp: '99%', players: 567 },
  { path: '/games/limbo', label: 'Limbo', icon: Zap, tag: 'Original', color: '#eab308', desc: 'Target a multiplier', rtp: '99%', players: 430 },
  { path: '/games/wheel', label: 'Wheel', icon: Circle, tag: 'Original', color: '#f97316', desc: 'Spin and win', rtp: '98%', players: 721 },
  { path: '/games/hilo', label: 'Hi-Lo', icon: ArrowUpDown, tag: 'Original', color: '#06b6d4', desc: 'Higher or lower?', rtp: '99%', players: 318 },
  { path: '/games/keno', label: 'Keno', icon: Grid3x3, tag: 'Original', color: '#ec4899', desc: 'Pick your lucky numbers', rtp: '97%', players: 209 },
  { path: '/games/blackjack', label: 'Blackjack', icon: Spade, tag: 'Classic', color: '#94a3b8', desc: 'Beat the dealer to 21', rtp: '99.5%', players: 1876 },
  { path: '/games/roulette', label: 'Roulette', icon: CircleDot, tag: 'Classic', color: '#ef4444', desc: 'European roulette', rtp: '97.3%', players: 1122 },
  { path: '/games/slots', label: 'Slots', icon: Layers, tag: 'Classic', color: '#f59e0b', desc: '5-reel video slots', rtp: '96%', players: 2341 },
  { path: '/games/baccarat', label: 'Baccarat', icon: CreditCard, tag: 'Classic', color: '#22c55e', desc: 'Player vs Banker', rtp: '98.9%', players: 543 },
]

const CATEGORIES = ['All', 'Originals', 'Classic', 'Slots', 'Cards', 'Popular']

export default function Casino() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = GAMES.filter(g => {
    const matchSearch = g.label.toLowerCase().includes(search.toLowerCase())
    const matchCat =
      category === 'All' ||
      (category === 'Originals' && g.tag === 'Original') ||
      (category === 'Classic' && g.tag === 'Classic') ||
      (category === 'Slots' && g.label === 'Slots') ||
      (category === 'Cards' && ['Blackjack', 'Baccarat', 'Hi-Lo'].includes(g.label)) ||
      (category === 'Popular' && g.players > 800)
    return matchSearch && matchCat
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Casino</h1>
          <p className="text-gray-500 text-sm mt-1">{GAMES.length} games available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-8"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                category === cat
                  ? 'bg-vault-green text-black'
                  : 'bg-vault-panel border border-vault-border text-gray-400 hover:text-white hover:border-vault-green/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map(({ path, label, icon: Icon, tag, color, desc, rtp, players }) => (
          <Link key={path} to={path} className="game-card flex flex-col">
            {/* Game preview area */}
            <div className="relative h-32 flex items-center justify-center overflow-hidden" style={{ backgroundColor: color + '15' }}>
              <Icon size={56} style={{ color, opacity: 0.7 }} className="group-hover:scale-110 transition-transform duration-300" />
              <span
                className="absolute top-2 right-2 badge text-[10px]"
                style={{ backgroundColor: tag === 'Original' ? '#3bc11720' : '#3b82f620', color: tag === 'Original' ? '#3bc117' : '#60a5fa' }}
              >
                {tag}
              </span>
            </div>
            {/* Info */}
            <div className="p-3 flex-1">
              <div className="font-bold text-white mb-0.5">{label}</div>
              <div className="text-xs text-gray-500 mb-2">{desc}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">RTP: <span className="text-gray-400">{rtp}</span></span>
                <span className="flex items-center gap-1 text-gray-600">
                  <span className="w-1.5 h-1.5 bg-vault-green rounded-full" />
                  {players.toLocaleString()} playing
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No games found for "{search}"</p>
        </div>
      )}
    </div>
  )
}
