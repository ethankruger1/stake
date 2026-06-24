import { useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { Search, Bell, ChevronDown, Wallet, Menu, Plus, TrendingUp } from 'lucide-react'

const CURRENCY_ICONS = {
  USD: '💵', BTC: '₿', ETH: 'Ξ', USDT: '₮', BNB: '⬡', SOL: '◎', XRP: '✕', LTC: 'Ł'
}

export default function Header({ onMenuToggle }) {
  const { balance, currency, setCurrency, currencies, setBalance } = useWallet()
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

  return (
    <>
      <header className="h-14 bg-vault-card border-b border-vault-border flex items-center px-4 gap-3 flex-shrink-0 z-20">
        <button onClick={onMenuToggle} className="text-gray-400 hover:text-white transition-colors lg:hidden">
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search games..."
              className="w-full bg-vault-bg border border-vault-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-vault-green/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Stats ticker */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 bg-vault-bg border border-vault-border rounded-lg px-3 py-1.5">
          <TrendingUp size={12} className="text-vault-green" />
          <span>24h Volume: <span className="text-white font-semibold">$48.2M</span></span>
        </div>

        {loggedIn ? (
          <>
            {/* Balance */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyMenu(o => !o)}
                className="flex items-center gap-2 bg-vault-bg border border-vault-border hover:border-vault-green/50 rounded-lg px-3 py-1.5 transition-colors"
              >
                <span className="text-sm">{CURRENCY_ICONS[currency]}</span>
                <span className="text-sm font-bold text-white">{balance.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{currency}</span>
                <ChevronDown size={12} className="text-gray-500" />
              </button>
              {showCurrencyMenu && (
                <div className="absolute right-0 top-full mt-1 bg-vault-card border border-vault-border rounded-xl shadow-2xl p-2 z-50 min-w-[160px]">
                  {currencies.map(c => (
                    <button key={c}
                      onClick={() => { setCurrency(c); setShowCurrencyMenu(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        currency === c ? 'bg-vault-green/10 text-vault-green' : 'text-gray-300 hover:bg-vault-hover'
                      }`}
                    >
                      <span>{CURRENCY_ICONS[c]}</span>
                      <span className="font-medium">{c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-1.5 bg-vault-green hover:bg-vault-green-light text-black font-bold text-sm px-3 py-1.5 rounded-lg transition-colors active:scale-95"
            >
              <Plus size={14} />
              Deposit
            </button>

            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-vault-green rounded-full text-black text-[9px] font-black flex items-center justify-center">3</span>
            </button>

            <button
              onClick={() => setShowUserMenu(o => !o)}
              className="flex items-center gap-2 hover:bg-vault-hover rounded-lg px-2 py-1.5 transition-colors relative"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vault-green to-blue-500 flex items-center justify-center text-xs font-black text-white">
                P
              </div>
              <ChevronDown size={12} className="text-gray-500" />
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-vault-card border border-vault-border rounded-xl shadow-2xl p-2 z-50 min-w-[180px]">
                  {['Profile', 'Bet History', 'Settings', 'VIP Status'].map(item => (
                    <button key={item} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-vault-hover hover:text-white rounded-lg transition-colors">
                      {item}
                    </button>
                  ))}
                  <div className="border-t border-vault-border mt-1 pt-1">
                    <button onClick={() => setLoggedIn(false)} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoggedIn(true) }}
              className="btn-secondary text-sm py-1.5 px-4"
            >
              Sign In
            </button>
            <button
              onClick={() => { setLoggedIn(true) }}
              className="btn-primary text-sm py-1.5 px-4"
            >
              Register
            </button>
          </div>
        )}
      </header>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDepositModal(false)}>
          <div className="bg-vault-card border border-vault-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Deposit</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[100, 500, 1000, 5000].map(amt => (
                <button key={amt}
                  onClick={() => { setBalance(b => b + amt); setShowDepositModal(false) }}
                  className="panel hover:border-vault-green/50 text-center py-3 cursor-pointer transition-all hover:bg-vault-hover"
                >
                  <div className="text-lg font-bold text-vault-green">+${amt}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Add to balance</div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDepositModal(false)} className="btn-secondary w-full">Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
