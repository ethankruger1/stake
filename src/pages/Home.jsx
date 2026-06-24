import { Link } from 'react-router-dom'
import LiveBets from '../components/UI/LiveBets'
import {
  Bomb, TrendingUp, Dices, CircleDashed, Zap, Circle,
  ArrowUpDown, Grid3x3, Spade, CircleDot, Layers, CreditCard,
  Star, Trophy, Gift, Shield, Flame, ChevronRight,
} from 'lucide-react'

const FEATURED = [
  { path: '/games/crash', label: 'Crash', icon: TrendingUp, color: 'from-green-900 to-emerald-700', badge: '🔥 Hot', desc: 'Ride the multiplier before it crashes' },
  { path: '/games/mines', label: 'Mines', icon: Bomb, color: 'from-red-900 to-orange-800', badge: '⭐ Top', desc: 'Dodge the mines, collect the gems' },
  { path: '/games/plinko', label: 'Plinko', icon: CircleDashed, color: 'from-purple-900 to-violet-700', badge: null, desc: 'Drop balls and win big multipliers' },
  { path: '/games/blackjack', label: 'Blackjack', icon: Spade, color: 'from-slate-800 to-slate-700', badge: '🃏 Classic', desc: 'Beat the dealer to 21' },
]

const ALL_GAMES = [
  { path: '/games/mines', label: 'Mines', icon: Bomb, tag: 'Original', color: '#ef4444' },
  { path: '/games/crash', label: 'Crash', icon: TrendingUp, tag: 'Original', color: '#22c55e' },
  { path: '/games/dice', label: 'Dice', icon: Dices, tag: 'Original', color: '#3b82f6' },
  { path: '/games/plinko', label: 'Plinko', icon: CircleDashed, tag: 'Original', color: '#a855f7' },
  { path: '/games/limbo', label: 'Limbo', icon: Zap, tag: 'Original', color: '#eab308' },
  { path: '/games/wheel', label: 'Wheel', icon: Circle, tag: 'Original', color: '#f97316' },
  { path: '/games/hilo', label: 'Hi-Lo', icon: ArrowUpDown, tag: 'Original', color: '#06b6d4' },
  { path: '/games/keno', label: 'Keno', icon: Grid3x3, tag: 'Original', color: '#ec4899' },
  { path: '/games/blackjack', label: 'Blackjack', icon: Spade, tag: 'Classic', color: '#94a3b8' },
  { path: '/games/roulette', label: 'Roulette', icon: CircleDot, tag: 'Classic', color: '#ef4444' },
  { path: '/games/slots', label: 'Slots', icon: Layers, tag: 'Classic', color: '#f59e0b' },
  { path: '/games/baccarat', label: 'Baccarat', icon: CreditCard, tag: 'Classic', color: '#22c55e' },
]

const STATS = [
  { label: 'Total Wagered', value: '$4.2B+', icon: Trophy },
  { label: 'Active Players', value: '128K', icon: Star },
  { label: 'Games Available', value: '3,000+', icon: Grid3x3 },
  { label: 'Jackpot Pool', value: '$2.1M', icon: Gift },
]

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-vault-card via-vault-panel to-vault-card border border-vault-border p-8">
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-6xl select-none" style={{ left: `${(i * 17) % 100}%`, top: `${(i * 13) % 100}%`, opacity: Math.random() }}>
              {['💎', '🎰', '🃏', '🎲', '💰'][i % 5]}
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge bg-vault-green/20 text-vault-green">🎰 Crypto Casino</span>
            <span className="badge bg-amber-500/20 text-amber-400">Provably Fair</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Win Big at <span className="text-vault-green">VaultBet</span>
          </h1>
          <p className="text-gray-400 mb-6 max-w-lg">
            The world's leading crypto casino. Play Mines, Crash, Dice, Blackjack and hundreds more with instant payouts.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/games/crash" className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
              Play Now <ChevronRight size={16} />
            </Link>
            <Link to="/casino" className="btn-secondary text-sm px-6 py-2.5">
              View All Games
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel flex items-center gap-3">
            <div className="w-10 h-10 bg-vault-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-vault-green" />
            </div>
            <div>
              <div className="font-black text-lg text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Flame size={18} className="text-orange-400" /> Featured Games
          </h2>
          <Link to="/casino" className="text-sm text-vault-green hover:underline flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED.map(({ path, label, icon: Icon, color, badge, desc }) => (
            <Link key={path} to={path} className="group relative overflow-hidden rounded-xl border border-vault-border hover:border-vault-green/40 transition-all duration-200 aspect-video flex flex-col justify-end p-4">
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80`} />
              <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                <Icon size={80} />
              </div>
              {badge && (
                <span className="relative z-10 badge bg-black/40 text-white text-xs mb-2 self-start">
                  {badge}
                </span>
              )}
              <div className="relative z-10">
                <div className="font-black text-xl">{label}</div>
                <div className="text-xs text-white/70 mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Games Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">All Games</h2>
          <div className="flex items-center gap-2">
            <span className="badge bg-vault-green/10 text-vault-green">Originals</span>
            <span className="badge bg-blue-900/50 text-blue-400">Classics</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {ALL_GAMES.map(({ path, label, icon: Icon, tag, color }) => (
            <Link key={path} to={path}
              className="game-card p-4 flex flex-col items-center gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
                <Icon size={24} style={{ color }} />
              </div>
              <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{label}</span>
              <span
                className="badge text-[10px]"
                style={{ backgroundColor: tag === 'Original' ? '#3bc11720' : '#3b82f620', color: tag === 'Original' ? '#3bc117' : '#60a5fa' }}
              >
                {tag}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Bets */}
      <section>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-vault-green rounded-full animate-pulse" />
          Live Bets
        </h2>
        <LiveBets />
      </section>

      {/* Promotions Banner */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Weekly Rakeback', desc: 'Get up to 25% of your losses back every week.', color: 'from-blue-900/60 to-blue-800/30', icon: '💰', badge: '25% Back' },
            { title: 'VIP Program', desc: 'Climb levels for exclusive bonuses and higher limits.', color: 'from-amber-900/60 to-amber-800/30', icon: '👑', badge: 'Exclusive' },
            { title: 'Refer a Friend', desc: 'Earn commission every time your friend plays.', color: 'from-green-900/60 to-green-800/30', icon: '🤝', badge: 'Earn 15%' },
          ].map(({ title, desc, color, icon, badge }) => (
            <div key={title} className={`rounded-xl bg-gradient-to-r ${color} border border-vault-border p-5 cursor-pointer hover:border-vault-green/30 transition-colors`}>
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-bold mb-1">{title}</div>
              <div className="text-sm text-gray-400 mb-3">{desc}</div>
              <span className="badge bg-vault-green/20 text-vault-green">{badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vault-border pt-6 pb-2 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-vault-green rounded flex items-center justify-center">
            <span className="text-black font-black text-sm">V</span>
          </div>
          <span className="font-bold text-gray-400">VaultBet</span>
        </div>
        <p className="mb-1">🔒 Provably Fair · SSL Encrypted · Licensed & Regulated</p>
        <p>© 2024 VaultBet. All rights reserved. Gambling is for entertainment purposes. Play responsibly. 18+</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-gray-600">
          {['Terms', 'Privacy', 'AML Policy', 'Responsible Gambling', 'FAQ'].map(l => (
            <button key={l} className="hover:text-gray-400 transition-colors">{l}</button>
          ))}
        </div>
      </footer>
    </div>
  )
}
