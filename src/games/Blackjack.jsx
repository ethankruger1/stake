import { useState, useCallback } from 'react'
import { Spade } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = ['♥', '♦']

function createDeck() {
  return SUITS.flatMap(suit => VALUES.map(val => ({ suit, val }))).sort(() => Math.random() - 0.5)
}

function handValue(hand) {
  let total = 0, aces = 0
  for (const card of hand) {
    if (card.hidden) continue
    if (card.val === 'A') { aces++; total += 11 }
    else if (['J', 'Q', 'K'].includes(card.val)) total += 10
    else total += parseInt(card.val)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function Card({ card, small }) {
  if (!card) return null
  const isRed = RED_SUITS.includes(card.suit)
  const size = small ? 'w-12 h-16 text-xs' : 'w-16 h-22 text-sm'

  if (card.hidden) {
    return (
      <div className={`${size} rounded-lg border-2 border-vault-border bg-gradient-to-br from-vault-panel to-vault-card flex items-center justify-center text-2xl shadow-lg`}>
        🂠
      </div>
    )
  }

  return (
    <div className={`${size} w-14 h-20 rounded-lg border border-vault-border bg-white text-black flex flex-col justify-between p-1 shadow-lg select-none`}>
      <div className={`text-xs font-black leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div>{card.val}</div>
        <div>{card.suit}</div>
      </div>
      <div className={`text-lg font-black self-center ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
      <div className={`text-xs font-black leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div>{card.val}</div>
        <div>{card.suit}</div>
      </div>
    </div>
  )
}

function HandDisplay({ hand, label, score, highlight }) {
  return (
    <div className={`panel transition-all ${highlight ? 'border-vault-green/50 bg-vault-green/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`font-black text-lg ${score > 21 ? 'text-red-400' : score === 21 ? 'text-vault-green' : 'text-white'}`}>
          {score}
          {score === 21 && hand.length === 2 && <span className="text-xs text-vault-green ml-1">Blackjack!</span>}
          {score > 21 && <span className="text-xs text-red-400 ml-1">Bust!</span>}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {hand.map((card, i) => <Card key={i} card={card} />)}
      </div>
    </div>
  )
}

export default function Blackjack() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(5)
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [phase, setPhase] = useState('bet') // bet | playing | dealer | done
  const [result, setResult] = useState(null)
  const [doubled, setDoubled] = useState(false)
  const [history, setHistory] = useState([])

  const deal = useCallback(() => {
    if (bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return

    const newDeck = createDeck()
    const pHand = [newDeck.shift(), newDeck.shift()]
    const dHand = [newDeck.shift(), { ...newDeck.shift(), hidden: true }]

    setDeck(newDeck)
    setPlayerHand(pHand)
    setDealerHand(dHand)
    setPhase('playing')
    setResult(null)
    setDoubled(false)

    if (handValue(pHand) === 21) {
      const revealedDealer = dHand.map(c => ({ ...c, hidden: false }))
      const dScore = handValue(revealedDealer)
      setDealerHand(revealedDealer)
      if (dScore === 21) {
        setPhase('done')
        const refund = +(bet).toFixed(2)
        addWin(refund)
        setResult({ msg: 'Push — Both Blackjack!', type: 'push', payout: refund })
        addBetHistory({ id: Date.now(), game: 'Blackjack', bet: bet.toFixed(2), mult: '1.00', payout: refund.toFixed(2), won: false, time: Date.now() })
      } else {
        setPhase('done')
        const payout = +(bet * 2.5).toFixed(2)
        addWin(payout)
        setResult({ msg: '🃏 Blackjack! You win!', type: 'win', payout })
        addNotification(`🃏 Blackjack! Won $${payout.toFixed(2)}!`, 'win')
        addBetHistory({ id: Date.now(), game: 'Blackjack', bet: bet.toFixed(2), mult: '2.50', payout: payout.toFixed(2), won: true, time: Date.now() })
      }
    }
  }, [bet, balance, placeBet, addWin, addBetHistory, addNotification])

  const resolveGame = useCallback((finalPlayer, finalDealer, currentBet) => {
    const pScore = handValue(finalPlayer)
    const dScore = handValue(finalDealer)
    let msg, type, payout = 0

    if (pScore > 21) {
      msg = '💥 Bust! Dealer wins.'; type = 'lose'
    } else if (dScore > 21) {
      msg = '🎉 Dealer busts! You win!'; type = 'win'; payout = currentBet * 2
    } else if (pScore > dScore) {
      msg = '🎉 You win!'; type = 'win'; payout = currentBet * 2
    } else if (pScore < dScore) {
      msg = '😔 Dealer wins.'; type = 'lose'
    } else {
      msg = '🤝 Push!'; type = 'push'; payout = currentBet
    }

    payout = +payout.toFixed(2)
    if (payout > 0) addWin(payout)
    setResult({ msg, type, payout })
    setPhase('done')
    const mult = payout / currentBet
    addBetHistory({ id: Date.now(), game: 'Blackjack', bet: currentBet.toFixed(2), mult: mult.toFixed(2), payout: payout.toFixed(2), won: type === 'win', time: Date.now() })
    if (type === 'win') addNotification(`🎉 Won $${payout.toFixed(2)}!`, 'win')
    else if (type === 'lose') addNotification(`😔 Lost $${currentBet.toFixed(2)}`, 'loss')
    setHistory(h => [{ type }, ...h.slice(0, 19)])
  }, [addWin, addBetHistory, addNotification])

  const runDealer = useCallback((pHand, dHand, deckRef, currentBet) => {
    let dealer = dHand.map(c => ({ ...c, hidden: false }))
    let d = [...deckRef]
    while (handValue(dealer) < 17) dealer.push(d.shift())
    setDealerHand(dealer)
    setDeck(d)
    setPhase('dealer')
    setTimeout(() => resolveGame(pHand, dealer, currentBet), 500)
  }, [resolveGame])

  const hit = useCallback(() => {
    if (phase !== 'playing') return
    const [next, ...rest] = deck
    const newHand = [...playerHand, next]
    setPlayerHand(newHand)
    setDeck(rest)
    if (handValue(newHand) >= 21) {
      runDealer(newHand, dealerHand, rest, bet)
    }
  }, [phase, deck, playerHand, dealerHand, bet, runDealer])

  const stand = useCallback(() => {
    if (phase !== 'playing') return
    runDealer(playerHand, dealerHand, deck, bet)
  }, [phase, playerHand, dealerHand, deck, bet, runDealer])

  const double = useCallback(() => {
    if (phase !== 'playing' || bet > balance) return
    if (!placeBet(bet)) return
    setDoubled(true)
    const [next, ...rest] = deck
    const newHand = [...playerHand, next]
    setPlayerHand(newHand)
    setDeck(rest)
    runDealer(newHand, dealerHand, rest, bet * 2)
  }, [phase, bet, balance, deck, playerHand, dealerHand, placeBet, runDealer])

  const pScore = handValue(playerHand)
  const dScore = handValue(dealerHand.map(c => ({ ...c, hidden: false })))
  const dVisibleScore = handValue(dealerHand)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Spade size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-xl">Blackjack</h1>
          <p className="text-xs text-gray-500">Classic Casino</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 10).map((h, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 ${h.type === 'win' ? 'border-vault-green bg-vault-green/20' : h.type === 'push' ? 'border-yellow-500 bg-yellow-500/20' : 'border-red-500 bg-red-500/20'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={phase !== 'bet' && phase !== 'done'} />

          {result && (
            <div className={`panel text-center border ${
              result.type === 'win' ? 'border-vault-green/50 bg-green-900/20' :
              result.type === 'lose' ? 'border-red-500/50 bg-red-900/20' :
              'border-yellow-500/50 bg-yellow-900/20'
            }`}>
              <div className="font-bold text-lg">{result.msg}</div>
              {result.payout > 0 && <div className="text-vault-green font-black text-xl mt-1">+${result.payout.toFixed(2)}</div>}
            </div>
          )}

          {phase === 'bet' || phase === 'done' ? (
            <button onClick={deal} disabled={bet <= 0 || bet > balance} className="btn-primary w-full py-3">
              {phase === 'done' ? 'New Hand' : 'Deal'}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={hit} disabled={phase !== 'playing'} className="btn-primary py-3">Hit</button>
                <button onClick={stand} disabled={phase !== 'playing'} className="btn-secondary py-3">Stand</button>
              </div>
              <button
                onClick={double}
                disabled={phase !== 'playing' || playerHand.length !== 2 || bet > balance}
                className="btn-gold w-full py-2.5 text-sm"
              >
                Double ({bet * 2 > balance ? 'Insufficient' : `$${(bet * 2).toFixed(2)}`})
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="panel bg-vault-bg">
              <div className="text-gray-500">Your Hand</div>
              <div className={`font-black text-xl ${pScore > 21 ? 'text-red-400' : pScore === 21 ? 'text-vault-green' : 'text-white'}`}>{pScore || '—'}</div>
            </div>
            <div className="panel bg-vault-bg">
              <div className="text-gray-500">Dealer</div>
              <div className="font-black text-xl text-white">{dealerHand.length ? dVisibleScore : '—'}</div>
            </div>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p>• Blackjack pays 3:2</p>
            <p>• Dealer hits soft 17</p>
            <p>• Double on first two cards</p>
          </div>
        </div>

        <div className="space-y-4">
          <HandDisplay hand={dealerHand} label="Dealer's Hand" score={dVisibleScore} highlight={phase === 'dealer' || phase === 'done'} />
          <div className="flex items-center gap-3 justify-center my-2">
            <div className="flex-1 border-t border-vault-border" />
            <span className="text-xs text-gray-600">VS</span>
            <div className="flex-1 border-t border-vault-border" />
          </div>
          <HandDisplay hand={playerHand} label="Your Hand" score={pScore} highlight={phase === 'playing'} />
        </div>
      </div>
    </div>
  )
}
