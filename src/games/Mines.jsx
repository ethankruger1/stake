import { useState, useCallback } from 'react'
import { Bomb, Gem, RotateCcw, TrendingUp } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

function calcMultiplier(totalTiles, mines, revealed) {
  if (revealed === 0) return 1
  let mult = 1
  for (let i = 0; i < revealed; i++) {
    mult *= (totalTiles - mines - i) / (totalTiles - i)
  }
  return +(0.99 / mult).toFixed(4)
}

const MINE_COUNTS = [1, 2, 3, 5, 8, 10, 15, 20, 24]

export default function Mines() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [mineCount, setMineCount] = useState(3)
  const [grid, setGrid] = useState(Array(25).fill({ revealed: false, isMine: false, isGem: false }))
  const [mines, setMines] = useState([])
  const [gameActive, setGameActive] = useState(false)
  const [gemsFound, setGemsFound] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const currentMultiplier = calcMultiplier(25, mineCount, gemsFound)

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return

    const minePositions = new Set()
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * 25))
    }
    const mineArr = [...minePositions]
    setMines(mineArr)
    setGrid(Array(25).fill(null).map((_, i) => ({ revealed: false, isMine: mineArr.includes(i), isGem: false })))
    setGemsFound(0)
    setGameActive(true)
    setGameOver(false)
    setWon(false)
    setLastResult(null)
  }, [bet, balance, mineCount, placeBet])

  const revealTile = useCallback((index) => {
    if (!gameActive || grid[index].revealed || gameOver) return

    const tile = grid[index]
    if (tile.isMine) {
      const revealedGrid = grid.map((t, i) => ({
        ...t,
        revealed: t.isMine || t.revealed,
        isGem: !t.isMine && !t.revealed ? false : t.isGem,
      }))
      revealedGrid[index] = { ...tile, revealed: true }
      setGrid(revealedGrid)
      setGameActive(false)
      setGameOver(true)
      setWon(false)
      setLastResult({ won: false, amount: bet })
      addBetHistory({ id: Date.now(), game: 'Mines', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      addNotification(`💥 Hit a mine! Lost $${bet.toFixed(2)}`, 'loss')
    } else {
      const newGemsFound = gemsFound + 1
      const newGrid = [...grid]
      newGrid[index] = { ...tile, revealed: true, isGem: true }
      setGrid(newGrid)
      setGemsFound(newGemsFound)

      const newMult = calcMultiplier(25, mineCount, newGemsFound)
      const maxGems = 25 - mineCount
      if (newGemsFound === maxGems) {
        const payout = +(bet * newMult).toFixed(2)
        addWin(payout)
        setGameActive(false)
        setGameOver(true)
        setWon(true)
        setLastResult({ won: true, amount: payout, mult: newMult })
        addBetHistory({ id: Date.now(), game: 'Mines', bet: bet.toFixed(2), mult: newMult.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
        addNotification(`💎 You cleared the board! Won $${payout.toFixed(2)}`, 'win')
      }
    }
  }, [gameActive, grid, gameOver, bet, gemsFound, mineCount, addWin, addBetHistory, addNotification])

  const cashOut = useCallback(() => {
    if (!gameActive || gemsFound === 0) return
    const payout = +(bet * currentMultiplier).toFixed(2)
    addWin(payout)
    setGameActive(false)
    setGameOver(true)
    setWon(true)
    const revealedGrid = grid.map(t => ({ ...t, revealed: t.isMine ? true : t.revealed }))
    setGrid(revealedGrid)
    setLastResult({ won: true, amount: payout, mult: currentMultiplier })
    addBetHistory({ id: Date.now(), game: 'Mines', bet: bet.toFixed(2), mult: currentMultiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
    addNotification(`💰 Cashed out $${payout.toFixed(2)} (${currentMultiplier}x)`, 'win')
  }, [gameActive, gemsFound, bet, currentMultiplier, grid, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Bomb size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Mines</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* Controls */}
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={gameActive} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Mines Count
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {MINE_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => !gameActive && setMineCount(n)}
                  disabled={gameActive}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    mineCount === n
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-vault-bg border border-vault-border text-gray-400 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {gameActive && (
            <div className="panel bg-vault-bg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Current Multiplier</span>
                <TrendingUp size={14} className="text-vault-green" />
              </div>
              <div className="text-3xl font-black text-vault-green">{currentMultiplier.toFixed(2)}×</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Profit: <span className="text-vault-green">${(bet * currentMultiplier - bet).toFixed(2)}</span>
              </div>
            </div>
          )}

          {lastResult && (
            <div className={`panel text-center ${lastResult.won ? 'bg-green-900/20 border-vault-green/30' : 'bg-red-900/20 border-red-500/30'}`}>
              {lastResult.won ? (
                <>
                  <div className="text-vault-green font-black text-2xl">+${lastResult.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{lastResult.mult?.toFixed(2)}× multiplier</div>
                </>
              ) : (
                <div className="text-red-400 font-bold">Boom! 💥</div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!gameActive ? (
              <button onClick={startGame} disabled={bet <= 0 || bet > balance} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Gem size={16} /> Bet
              </button>
            ) : (
              <>
                <button onClick={cashOut} disabled={gemsFound === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Cash Out {gemsFound > 0 && `$${(bet * currentMultiplier).toFixed(2)}`}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="panel bg-vault-bg">
              <div className="text-gray-500">Mines</div>
              <div className="font-bold text-red-400 text-lg">{mineCount}</div>
            </div>
            <div className="panel bg-vault-bg">
              <div className="text-gray-500">Gems Left</div>
              <div className="font-bold text-vault-green text-lg">{25 - mineCount - gemsFound}</div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="panel flex items-center justify-center min-h-80">
          <div className="grid grid-cols-5 gap-2 w-full max-w-sm mx-auto">
            {grid.map((tile, i) => (
              <button
                key={i}
                onClick={() => revealTile(i)}
                disabled={!gameActive || tile.revealed}
                className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-200 font-bold no-select
                  ${!tile.revealed && gameActive ? 'bg-vault-panel border border-vault-border hover:bg-vault-hover hover:border-vault-green/40 hover:scale-105 active:scale-95 cursor-pointer' : ''}
                  ${!tile.revealed && !gameActive ? 'bg-vault-panel border border-vault-border opacity-60 cursor-default' : ''}
                  ${tile.revealed && tile.isGem ? 'bg-green-900/40 border border-vault-green/50 scale-105' : ''}
                  ${tile.revealed && tile.isMine ? 'bg-red-900/40 border border-red-500/50' : ''}
                `}
              >
                {tile.revealed ? (
                  tile.isMine ? <Bomb size={20} className="text-red-400" /> : <Gem size={20} className="text-vault-green" />
                ) : (
                  <span className="text-gray-600 text-lg font-bold">?</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
