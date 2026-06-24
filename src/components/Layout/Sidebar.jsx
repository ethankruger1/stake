import { Link, useLocation } from 'react-router-dom'
import {
  Bomb, TrendingUp, Dices, Circle, Spade, CircleDot,
  CircleDashed, ArrowUpDown, Grid3x3, Zap, Layers, CreditCard,
  Home, Trophy, Star, ChevronLeft, ChevronRight, Gamepad2,
  BarChart2, Users, MessageSquare, Shield, Gift, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

const ORIGINALS = [
  { path: '/games/mines', label: 'Mines', icon: Bomb, color: 'text-red-400' },
  { path: '/games/crash', label: 'Crash', icon: TrendingUp, color: 'text-green-400' },
  { path: '/games/dice', label: 'Dice', icon: Dices, color: 'text-blue-400' },
  { path: '/games/plinko', label: 'Plinko', icon: CircleDashed, color: 'text-purple-400' },
  { path: '/games/limbo', label: 'Limbo', icon: Zap, color: 'text-yellow-400' },
  { path: '/games/wheel', label: 'Wheel', icon: Circle, color: 'text-orange-400' },
  { path: '/games/hilo', label: 'Hi-Lo', icon: ArrowUpDown, color: 'text-cyan-400' },
  { path: '/games/keno', label: 'Keno', icon: Grid3x3, color: 'text-pink-400' },
]

const CLASSICS = [
  { path: '/games/blackjack', label: 'Blackjack', icon: Spade, color: 'text-white' },
  { path: '/games/roulette', label: 'Roulette', icon: CircleDot, color: 'text-red-400' },
  { path: '/games/slots', label: 'Slots', icon: Layers, color: 'text-yellow-400' },
  { path: '/games/baccarat', label: 'Baccarat', icon: CreditCard, color: 'text-green-400' },
]

const NAV = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/casino', label: 'Casino', icon: Gamepad2 },
]

function NavSection({ title, items, open, collapsed }) {
  const location = useLocation()
  const [expanded, setExpanded] = useState(true)

  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map(({ path, label, icon: Icon, color }) => (
          <Link
            key={path}
            to={path}
            title={label}
            className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-all duration-150 ${
              location.pathname === path
                ? 'bg-vault-green/20 text-vault-green'
                : 'text-gray-400 hover:text-white hover:bg-vault-hover'
            }`}
          >
            <Icon size={18} className={location.pathname === path ? 'text-vault-green' : color} />
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
      >
        {title}
        <ChevronDown size={12} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
      {expanded && (
        <div className="space-y-0.5 mt-1">
          {items.map(({ path, label, icon: Icon, color }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
                location.pathname === path
                  ? 'bg-vault-green/15 text-vault-green font-semibold border-l-2 border-vault-green ml-0 pl-[10px]'
                  : 'text-gray-400 hover:text-white hover:bg-vault-hover'
              }`}
            >
              <Icon size={16} className={location.pathname === path ? 'text-vault-green' : color} />
              {label}
              {path === '/games/crash' && (
                <span className="ml-auto badge bg-green-900/50 text-green-400">Live</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ open, onToggle }) {
  const location = useLocation()
  const collapsed = !open

  return (
    <aside
      className={`flex flex-col bg-vault-card border-r border-vault-border transition-all duration-200 flex-shrink-0 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-vault-border px-3 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-2'}`}>
        <div className="w-8 h-8 bg-vault-green rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-black font-black text-lg">V</span>
        </div>
        {!collapsed && (
          <span className="font-black text-white text-lg tracking-tight">
            Vault<span className="text-vault-green">Bet</span>
          </span>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="ml-auto text-gray-500 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggle} className="flex items-center justify-center h-8 text-gray-500 hover:text-white transition-colors border-b border-vault-border">
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {collapsed ? (
          <>
            {NAV.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} title={label}
                className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-all ${
                  location.pathname === path ? 'bg-vault-green/20 text-vault-green' : 'text-gray-400 hover:text-white hover:bg-vault-hover'
                }`}
              >
                <Icon size={18} />
              </Link>
            ))}
            <div className="border-t border-vault-border pt-2" />
            <NavSection items={ORIGINALS} collapsed />
            <div className="border-t border-vault-border pt-2" />
            <NavSection items={CLASSICS} collapsed />
          </>
        ) : (
          <>
            <div className="space-y-0.5">
              {NAV.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                    location.pathname === path ? 'bg-vault-green/15 text-vault-green font-semibold' : 'text-gray-400 hover:text-white hover:bg-vault-hover'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>

            <div className="border-t border-vault-border" />
            <NavSection title="Originals" items={ORIGINALS} />

            <div className="border-t border-vault-border" />
            <NavSection title="Classic Casino" items={CLASSICS} />

            <div className="border-t border-vault-border" />
            <div className="space-y-0.5">
              {[
                { icon: Trophy, label: 'Leaderboard', badge: null },
                { icon: Gift, label: 'Promotions', badge: 'New' },
                { icon: Users, label: 'Affiliates', badge: null },
                { icon: Shield, label: 'Provably Fair', badge: null },
                { icon: MessageSquare, label: 'Support', badge: null },
              ].map(({ icon: Icon, label, badge }) => (
                <button key={label}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-gray-400 hover:text-white hover:bg-vault-hover w-full"
                >
                  <Icon size={16} />
                  {label}
                  {badge && <span className="ml-auto badge bg-vault-green/20 text-vault-green">{badge}</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Version */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-vault-border">
          <p className="text-xs text-gray-600">VaultBet v1.0</p>
        </div>
      )}
    </aside>
  )
}
