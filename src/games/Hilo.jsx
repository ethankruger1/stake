import { useState, useCallback } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = ['♥', '♦']

function cardRank(card) {
  return VALUES.indexOf(card.val)
}

function createDeck() {
  return SUITS.flatMap(suit => VALUES.map(val => ({ suit, val }))).sort(() => Math.random() - 0.5)
}

function hiloMultiplier(card, direction) {
  const rank = cardRank(card)
  const higherCount = direction === 'higher' ? 12 - rank : rank
  const chance = higherCount / 13
  return chance > 0 ? +(0.97 / chance).toFixed(4) : 99
}

function PlayingCard({ card, size = 'lg', animKey }) {
  if (!card) {
    return (
      <div className={`${size === 'lg' ? 'w-28 h-40' : 'w-14 h-20'} rounded-xl border-2 border-dashed border-vault-border/40 bg-vault-panel/30`} />
    )
  }
  const isRed = RED_SUITS.includes(card.suit)
  const color = isRed ? '#dc2626' : '#111827'

  if (size === 'sm') {
    return (
      <div className="w-14 h-20 rounded-lg border border-gray-100 bg-white flex flex-col justify-between p-1 shadow-md select-none"
        style={{ animation: 'cardReveal 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <style>{`@keyframes cardReveal { from { transform: scale(0.7) rotateY(90deg); opacity:0; } to { transform: scale(1) rotateY(0); opacity:1; } }`}</style>
        <div className="font-black text-xs leading-tight" style={{ color }}>
          <div>{card.val}</div>
          <div>{card.suit}</div>
        </div>
        <div className="text-lg font-black self-center" style={{ color }}>{card.suit}</div>
      </div>
    )
  }

  return (
    <div
      key={animKey}
      className="w-32 h-44 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between p-3 shadow-2xl select-none relative overflow-hidden"
      style={{ animation: 'bigCardReveal 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <style>{`
        @keyframes bigCardReveal {
          from { transform: scale(0.5) rotateY(90deg) translateY(-20px); opacity: 0; }
          to   { transform: scale(1) rotateY(0) translateY(0); opacity: 1; }
        }
      `}</style>
      {/* Subtle card texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)' ,backgroundSize: '8px 8px' }} />
      <div className="font-black leading-tight" style={{ color, fontFamily: 'Georgia, serif' }}>
        <div className="text-2xl">{card.val}</div>
        <div className="text-xl">{card.suit}</div>
      </div>
      <div className="text-5xl font-black self-center" style={{ color, fontFamily: 'Georgia, serif', textShadow: isRed ? '0 0 20px #fca5a5' : undefined }}>
        {card.suit}
      </div>
      <div className="font-black leading-tight self-end rotate-180" style={{ color, fontFamily: 'Georgia, serif' }}>
        <div className="text-2xl">{card.val}</div>
        <div className="text-xl">{card.suit}</div>
      </div>
    </div>
  )
}

export default function Hilo() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [deck, setDeck] = useState([])
  const [currentCard, setCurrentCard] = useState(null)
  const [cardHistory, setCardHistory] = useState([])
  const [phase, setPhase] = useState('bet')
  const [multiplier, setMultiplier] = useState(1)
  const [result, setResult] = useState(null)
  const [gameHistory, setGameHistory] = useState([])
  const [cardKey, setCardKey] = useState(0)

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return
    const newDeck = createDeck()
    const first = newDeck.shift()
    setDeck(newDeck)
    setCurrentCard(first)
    setCardHistory([first])
    setPhase('playing')
    setMultiplier(1)
    setResult(null)
    setCardKey(k => k + 1)
  }, [bet, balance, placeBet])

  const guess = useCallback((direction) => {
    if (phase !== 'playing' || deck.length === 0) return
    const [next, ...rest] = deck
    const currentRank = cardRank(currentCard)
    const nextRank = cardRank(next)
    const mult = hiloMultiplier(currentCard, direction)
    const won = direction === 'higher' ? nextRank > currentRank : nextRank < currentRank

    setCurrentCard(next)
    setCardHistory(h => [...h, next])
    setDeck(rest)
    setCardKey(k => k + 1)

    if (won) {
      const newMult = +(multiplier * mult).toFixed(4)
      setMultiplier(newMult)
      addNotification(`✓ Correct! ${next.val}${next.suit} — ${newMult.toFixed(2)}×`, 'win')
    } else {
      setPhase('done')
      setResult({ won: false, payout: 0 })
      addBetHistory({ id: Date.now(), game: 'Hi-Lo', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      addNotification(`✗ Wrong! ${next.val}${next.suit} — Lost $${bet.toFixed(2)}`, 'loss')
      setGameHistory(h => [{ won: false, mult: 0 }, ...h.slice(0, 19)])
    }
  }, [phase, deck, currentCard, multiplier, bet, addBetHistory, addNotification])

  const cashOut = useCallback(() => {
    if (phase !== 'playing') return
    const payout = +(bet * multiplier).toFixed(2)
    addWin(payout)
    setPhase('done')
    setResult({ won: true, payout })
    addBetHistory({ id: Date.now(), game: 'Hi-Lo', bet: bet.toFixed(2), mult: multiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
    addNotification(`💰 Cashed out $${payout.toFixed(2)} (${multiplier.toFixed(2)}×)!`, 'win')
    setGameHistory(h => [{ won: true, mult: multiplier }, ...h.slice(0, 19)])
  }, [phase, bet, multiplier, addWin, addBetHistory, addNotification])

  const currentRank = currentCard ? cardRank(currentCard) : -1
  const hiMult = currentCard ? hiloMultiplier(currentCard, 'higher') : 0
  const loMult = currentCard ? hiloMultiplier(currentCard, 'lower') : 0
  const highPct = currentCard ? Math.max(0, ((12 - currentRank) / 13) * 100) : 50
  const lowPct = currentCard ? Math.max(0, (currentRank / 13) * 100) : 50
  const equalPct = Math.max(0, 100 - highPct - lowPct)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <ArrowUpDown size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Hi-Lo</h1>
          <p className="text-xs text-gray-500">VaultBet Original · Predict Higher or Lower</p>
        </div>
        <div className="ml-auto flex gap-1">
          {gameHistory.slice(0, 10).map((h, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 ${h.won ? 'border-vault-green bg-vault-green/20' : 'border-red-500 bg-red-500/20'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={phase === 'playing'} />

          {/* Live multiplier */}
          {phase === 'playing' && (
            <div className="rounded-xl bg-gradient-to-br from-vault-green/10 to-transparent border border-vault-green/20 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Accumulated Multiplier</span>
                <TrendingUp size={12} className="text-vault-green" />
              </div>
              <div className="text-3xl font-black text-vault-green">{multiplier.toFixed(4)}×</div>
              <div className="text-xs text-gray-500 mt-1">
                Payout: <span className="text-vault-green font-bold">${(bet * multiplier).toFixed(2)}</span>
                {' '}· Profit: <span className="text-vault-green font-bold">+${(bet * multiplier - bet).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Probability bar */}
          {currentCard && phase === 'playing' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Card Distribution</label>
              <div className="h-5 rounded-full overflow-hidden flex gap-px">
                <div className="bg-blue-500/80 flex items-center justify-center text-[9px] font-bold text-white transition-all"
                  style={{ width: `${lowPct}%` }}>
                  {lowPct > 10 ? `${lowPct.toFixed(0)}%` : ''}
                </div>
                {equalPct > 3 && (
                  <div className="bg-gray-600 flex items-center justify-center text-[9px] font-bold text-white transition-all"
                    style={{ width: `${equalPct}%` }} />
                )}
                <div className="bg-vault-green flex items-center justify-center text-[9px] font-bold text-black transition-all"
                  style={{ width: `${highPct}%` }}>
                  {highPct > 10 ? `${highPct.toFixed(0)}%` : ''}
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span className="text-blue-400">{lowPct.toFixed(0)}% Lower</span>
                <span className="text-vault-green">{highPct.toFixed(0)}% Higher</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 text-center border ${result.won ? 'bg-vault-green/10 border-vault-green/30' : 'bg-red-900/20 border-red-500/30'}`}>
              {result.won ? (
                <>
                  <div className="text-vault-green font-black text-2xl">+${(result.payout - bet).toFixed(2)}</div>
                  <div className="text-xs text-gray-400 mt-1">{multiplier.toFixed(2)}× · Total ${result.payout.toFixed(2)}</div>
                </>
              ) : (
                <>
                  <div className="text-red-400 font-black text-xl">Wrong Guess!</div>
                  <div className="text-xs text-gray-400 mt-1">Lost ${bet.toFixed(2)}</div>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          {phase === 'playing' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => guess('higher')} disabled={currentRank >= 12}
                  className="btn-primary py-3 flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ArrowUp size={20} />
                  <span className="text-xs font-bold">Higher</span>
                  <span className="text-[10px] opacity-75">{hiMult.toFixed(2)}×</span>
                </button>
                <button onClick={() => guess('lower')} disabled={currentRank <= 0}
                  className="btn-red py-3 flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ArrowDown size={20} />
                  <span className="text-xs font-bold">Lower</span>
                  <span className="text-[10px] opacity-75">{loMult.toFixed(2)}×</span>
                </button>
              </div>
              <button onClick={cashOut} className="btn-gold w-full py-2.5 font-bold">
                Cash Out ${(bet * multiplier).toFixed(2)}
              </button>
            </div>
          ) : (
            <button onClick={startGame} disabled={bet <= 0 || bet > balance}
              className="btn-primary w-full py-3 font-black text-lg">
              {phase === 'done' ? 'New Game' : 'Start Game'}
            </button>
          )}

          {currentCard && (
            <div className="grid grid-cols-3 gap-1 text-center text-xs">
              <div className="panel bg-vault-bg py-2">
                <div className="text-gray-500">Higher</div>
                <div className="font-black text-vault-green">{Math.max(0, 12 - currentRank)}</div>
              </div>
              <div className="panel bg-vault-bg py-2">
                <div className="text-gray-500">Equal</div>
                <div className="font-black text-gray-400">1</div>
              </div>
              <div className="panel bg-vault-bg py-2">
                <div className="text-gray-500">Lower</div>
                <div className="font-black text-blue-400">{currentRank}</div>
              </div>
            </div>
          )}
        </div>

        <div className="panel flex flex-col items-center justify-center gap-5 min-h-80">
          {/* Card history trail */}
          {cardHistory.length > 1 && (
            <div className="flex gap-2 items-end w-full justify-center flex-wrap">
              {cardHistory.slice(-6, -1).map((card, i) => (
                <div key={i} className="opacity-60 hover:opacity-90 transition-opacity">
                  <PlayingCard card={card} size="sm" />
                </div>
              ))}
              {cardHistory.length > 6 && (
                <div className="text-xs text-gray-600 self-end mb-2">+{cardHistory.length - 6} more</div>
              )}
            </div>
          )}

          {/* Current card */}
          <div className="flex flex-col items-center gap-4">
            {currentCard ? (
              <>
                <PlayingCard card={currentCard} size="lg" animKey={cardKey} />
                {phase === 'playing' && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Will the next card be</p>
                    <p className="text-white font-bold">higher or lower than{' '}
                      <span className={RED_SUITS.includes(currentCard.suit) ? 'text-red-400' : 'text-white'}>
                        {currentCard.val}{currentCard.suit}
                      </span>?
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-600 text-center">
                <ArrowUpDown size={56} className="mx-auto mb-4 opacity-20" />
                <p className="font-semibold">Set your bet and start a game</p>
                <p className="text-xs mt-1 text-gray-700">Guess if the next card is higher or lower</p>
              </div>
            )}
          </div>

          {/* Streak / deck info */}
          {phase === 'playing' && deck.length > 0 && (
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>{deck.length} cards remaining</span>
              <span>·</span>
              <span>{cardHistory.length - 1} correct guess{cardHistory.length !== 2 ? 'es' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
