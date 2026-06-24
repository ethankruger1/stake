import { useWallet } from '../../context/WalletContext'
import { useEffect, useState } from 'react'

const GAMES = ['Mines', 'Crash', 'Dice', 'Plinko', 'Blackjack', 'Roulette', 'Wheel', 'Hi-Lo', 'Keno', 'Limbo', 'Slots', 'Baccarat']
const USERS = ['Dragon88', 'CryptoKing', 'MoonBet', 'LuckyAce', 'DiamondHands', 'RocketBoy', 'WhaleBet', 'GoldenEagle', 'NightOwl', 'SunRider']

function randomBet() {
  const won = Math.random() > 0.45
  const bet = (Math.random() * 200 + 1).toFixed(2)
  const mult = won ? (Math.random() * 10 + 1.1).toFixed(2) : '0.00'
  const payout = won ? (parseFloat(bet) * parseFloat(mult)).toFixed(2) : '0.00'
  return {
    id: Math.random(),
    user: USERS[Math.floor(Math.random() * USERS.length)],
    game: GAMES[Math.floor(Math.random() * GAMES.length)],
    bet,
    mult,
    payout,
    won,
    time: Date.now(),
  }
}

export default function LiveBets() {
  const { bets } = useWallet()
  const [liveBets, setLiveBets] = useState(() => Array.from({ length: 12 }, randomBet))

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBets(prev => [randomBet(), ...prev.slice(0, 19)])
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const allBets = [...bets.map(b => ({ ...b, isOwn: true })), ...liveBets]
    .sort((a, b) => (b.time || 0) - (a.time || 0))
    .slice(0, 20)

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Live Bets</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-vault-green rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 font-semibold uppercase tracking-wider pb-2 border-b border-vault-border">
        <span>Player</span>
        <span>Game</span>
        <span>Bet</span>
        <span className="text-right">Payout</span>
      </div>
      <div className="space-y-0.5 mt-2 max-h-80 overflow-y-auto">
        {allBets.map((bet, i) => (
          <div
            key={bet.id || i}
            className={`grid grid-cols-4 gap-2 text-xs py-1.5 px-1 rounded transition-colors ${
              bet.isOwn ? 'bg-vault-green/5 border border-vault-green/10' : 'hover:bg-vault-hover/50'
            }`}
          >
            <span className={`font-semibold truncate ${bet.isOwn ? 'text-vault-green' : 'text-gray-300'}`}>
              {bet.isOwn ? 'You' : bet.user}
            </span>
            <span className="text-gray-500 truncate">{bet.game}</span>
            <span className="text-gray-300">${bet.bet}</span>
            <span className={`text-right font-bold ${bet.won ? 'text-vault-green' : 'text-gray-600'}`}>
              {bet.won ? `$${bet.payout}` : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
