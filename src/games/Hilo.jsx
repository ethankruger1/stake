import { useState, useCallback } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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

function CardDisplay({ card, size = 'lg' }) {
  if (!card) return <div className={`${size === 'lg' ? 'w-24 h-36' : 'w-14 h-20'} rounded-xl border border-vault-border bg-vault-panel`} />
  const isRed = RED_SUITS.includes(card.suit)
  const sizeClass = size === 'lg' ? 'w-24 h-36 text-lg' : 'w-14 h-20 text-sm'
  return (
    <div className={`${sizeClass} rounded-xl border border-gray-200 bg-white text-black flex flex-col justify-between p-2 shadow-xl select-none`}>
      <div className={`font-black leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div>{card.val}</div>
        <div>{card.suit}</div>
      </div>
      <div className={`text-2xl font-black self-center ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
      <div className={`font-black leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div>{card.val}</div>
        <div>{card.suit}</div>
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
  const [phase, setPhase] = useState('bet') // bet | playing | done
  const [multiplier, setMultiplier] = useState(1)
  const [result, setResult] = useState(null)
  const [gameHistory, setGameHistory] = useState([])

  const hiloMultiplier = (card, direction) => {
    const rank = cardRank(card)
    const higherCount = direction === 'higher' ? 13 - rank - 1 : rank
    const chance = higherCount / 52
    return chance > 0 ? +(0.97 / chance).toFixed(4) : 99
  }

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
  }, [bet, balance, placeBet])

  const guess = useCallback((direction) => {
    if (phase !== 'playing' || deck.length === 0) return

    const [next, ...rest] = deck
    const currentRank = cardRank(currentCard)
    const nextRank = cardRank(next)
    const mult = hiloMultiplier(currentCard, direction)

    let won = false
    if (direction === 'higher') won = nextRank > currentRank
    else if (direction === 'lower') won = nextRank < currentRank
    // Skip on equal

    if (won) {
      const newMult = +(multiplier * mult).toFixed(4)
      setMultiplier(newMult)
      setCurrentCard(next)
      setCardHistory(h => [...h, next])
      setDeck(rest)
      addNotification(`✓ Correct! ${next.val}${next.suit} — ${newMult.toFixed(2)}×`, 'win')
    } else {
      setCurrentCard(next)
      setCardHistory(h => [...h, next])
      setPhase('done')
      setResult({ won: false, payout: 0, finalCard: next })
      addBetHistory({ id: Date.now(), game: 'Hi-Lo', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      addNotification(`✗ Wrong! ${next.val}${next.suit} — Lost $${bet.toFixed(2)}`, 'loss')
      setGameHistory(h => [{ won: false }, ...h.slice(0, 19)])
    }
  }, [phase, deck, currentCard, multiplier, bet, addWin, addBetHistory, addNotification])

  const cashOut = useCallback(() => {
    if (phase !== 'playing') return
    const payout = +(bet * multiplier).toFixed(2)
    addWin(payout)
    setPhase('done')
    setResult({ won: true, payout })
    addBetHistory({ id: Date.now(), game: 'Hi-Lo', bet: bet.toFixed(2), mult: multiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
    addNotification(`💰 Cashed out $${payout.toFixed(2)} (${multiplier.toFixed(2)}×)!`, 'win')
    setGameHistory(h => [{ won: true }, ...h.slice(0, 19)])
  }, [phase, bet, multiplier, addWin, addBetHistory, addNotification])

  const hiMult = currentCard ? hiloMultiplier(currentCard, 'higher') : 0
  const loMult = currentCard ? hiloMultiplier(currentCard, 'lower') : 0
  const currentRank = currentCard ? cardRank(currentCard) : -1

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <ArrowUpDown size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Hi-Lo</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1">
          {gameHistory.slice(0, 10).map((h, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 ${h.won ? 'border-vault-green bg-vault-green/20' : 'border-red-500 bg-red-500/20'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={phase === 'playing'} />

          {phase === 'playing' && (
            <div className="panel bg-vault-bg text-center">
              <div className="text-xs text-gray-500 mb-0.5">Current Multiplier</div>
              <div className="text-3xl font-black text-vault-green">{multiplier.toFixed(2)}×</div>
              <div className="text-xs text-gray-500 mt-1">
                Profit: <span className="text-vault-green">${(bet * multiplier - bet).toFixed(2)}</span>
              </div>
            </div>
          )}

          {result && (
            <div className={`panel text-center ${result.won ? 'border-vault-green/50 bg-green-900/20' : 'border-red-500/30 bg-red-900/10'}`}>
              {result.won ? (
                <><div className="text-vault-green font-black text-xl">Won ${result.payout.toFixed(2)}</div><div className="text-xs text-gray-400 mt-0.5">{multiplier.toFixed(2)}× multiplier</div></>
              ) : (
                <div className="text-red-400 font-bold">Wrong guess! 💥</div>
              )}
            </div>
          )}

          {phase === 'bet' || phase === 'done' ? (
            <button onClick={startGame} disabled={bet <= 0 || bet > balance} className="btn-primary w-full py-3">
              {phase === 'done' ? 'New Game' : 'Start Game'}
            </button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => guess('higher')} disabled={currentRank >= 12} className="btn-primary py-3 flex flex-col items-center">
                  <ArrowUp size={18} />
                  <span className="text-xs mt-0.5">Higher</span>
                  <span className="text-[10px] opacity-70">{hiMult.toFixed(2)}×</span>
                </button>
                <button onClick={() => guess('lower')} disabled={currentRank <= 0} className="btn-red py-3 flex flex-col items-center">
                  <ArrowDown size={18} />
                  <span className="text-xs mt-0.5">Lower</span>
                  <span className="text-[10px] opacity-70">{loMult.toFixed(2)}×</span>
                </button>
              </div>
              <button onClick={cashOut} className="btn-gold w-full py-2.5 text-sm">
                Cash Out ${(bet * multiplier).toFixed(2)}
              </button>
            </>
          )}

          {currentCard && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Higher: {Math.max(0, 12 - currentRank)} cards</div>
              <div>Lower: {currentRank} cards</div>
              <div>Cards left: {deck.length}</div>
            </div>
          )}
        </div>

        <div className="panel flex flex-col items-center justify-center gap-6 min-h-80">
          {/* Card history */}
          {cardHistory.length > 1 && (
            <div className="flex gap-2 items-center">
              {cardHistory.slice(-5, -1).map((card, i) => (
                <CardDisplay key={i} card={card} size="sm" />
              ))}
              {cardHistory.length > 5 && <span className="text-gray-500 text-sm">+{cardHistory.length - 5}</span>}
            </div>
          )}

          {/* Current card */}
          <div className="flex flex-col items-center gap-3">
            {currentCard ? (
              <>
                <CardDisplay card={currentCard} size="lg" />
                {phase === 'playing' && (
                  <div className="text-center text-sm text-gray-400">
                    Is the next card higher or lower?
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-600 text-center">
                <ArrowUpDown size={48} className="mx-auto mb-3 opacity-30" />
                <p>Start a game to play!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
