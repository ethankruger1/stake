import { useState, useCallback } from 'react'
import { Bomb, Gem, TrendingUp, RotateCcw } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

function calcMultiplier(mines, revealed) {
  if (revealed === 0) return 1
  let prob = 1
  for (let i = 0; i < revealed; i++) {
    prob *= (25 - mines - i) / (25 - i)
  }
  return Math.max(1, +(0.99 / prob).toFixed(4))
}

const PRESETS = [1, 3, 5, 10, 15, 24]

function Tile({ state, onClick, gameActive, index }) {
  const isRevealed = state.revealed
  const isGem = state.isGem
  const isMine = state.isMine && state.revealed

  return (
    <button
      onClick={onClick}
      disabled={!gameActive || isRevealed}
      className={`
        aspect-square rounded-xl flex items-center justify-center transition-all duration-200 relative overflow-hidden no-select
        ${!isRevealed && gameActive
          ? 'bg-vault-panel border border-vault-border hover:border-vault-green/60 hover:bg-vault-hover hover:scale-105 active:scale-95 cursor-pointer'
          : ''}
        ${!isRevealed && !gameActive
          ? 'bg-vault-panel border border-vault-border/40 opacity-60 cursor-default'
          : ''}
        ${isGem
          ? 'bg-gradient-to-br from-emerald-900/60 to-green-900/40 border-2 border-vault-green/60 shadow-lg shadow-vault-green/10'
          : ''}
        ${isMine
          ? 'bg-gradient-to-br from-red-900/60 to-red-800/40 border-2 border-red-500/60 shadow-lg shadow-red-500/10'
          : ''}
      `}
    >
      {/* Shimmer on unrevealed */}
      {!isRevealed && gameActive && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
      )}

      {isRevealed ? (
        isMine ? (
          <div style={{ animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <Bomb size={22} className="text-red-400" />
            <style>{`@keyframes popIn { from { transform: scale(0) rotate(-20deg); opacity:0; } to { transform: scale(1) rotate(0); opacity:1; } }`}</style>
          </div>
        ) : (
          <div style={{ animation: 'gemPop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <Gem size={22} className="text-vault-green drop-shadow-sm" />
            <style>{`@keyframes gemPop { from { transform: scale(0) rotate(-15deg); opacity:0; } to { transform: scale(1) rotate(0); opacity:1; } }`}</style>
          </div>
        )
      ) : (
        <div className="w-3 h-3 rounded-full bg-vault-border/50" />
      )}
    </button>
  )
}

export default function Mines() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [mineCount, setMineCount] = useState(3)
  const [grid, setGrid] = useState(Array(25).fill(null).map(() => ({ revealed: false, isMine: false, isGem: false })))
  const [minePositions, setMinePositions] = useState([])
  const [gameActive, setGameActive] = useState(false)
  const [gemsFound, setGemsFound] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [history, setHistory] = useState([])

  const currentMultiplier = calcMultiplier(mineCount, gemsFound)
  const potentialPayout = +(bet * currentMultiplier).toFixed(2)
  const maxGems = 25 - mineCount

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return

    const positions = new Set()
    while (positions.size < mineCount) positions.add(Math.floor(Math.random() * 25))
    const mines = [...positions]

    setMinePositions(mines)
    setGrid(Array(25).fill(null).map((_, i) => ({ revealed: false, isMine: mines.includes(i), isGem: false })))
    setGemsFound(0)
    setGameActive(true)
    setGameOver(false)
    setLastResult(null)
  }, [bet, balance, mineCount, placeBet])

  const revealTile = useCallback((i) => {
    if (!gameActive || grid[i].revealed || gameOver) return

    if (grid[i].isMine) {
      const newGrid = grid.map((t, idx) => idx === i ? { ...t, revealed: true } : t.isMine ? { ...t, revealed: true } : t)
      setGrid(newGrid)
      setGameActive(false)
      setGameOver(true)
      setLastResult({ won: false, amount: bet })
      addBetHistory({ id: Date.now(), game: 'Mines', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      addNotification(`💥 Mine hit! Lost $${bet.toFixed(2)}`, 'loss')
      setHistory(h => [{ won: false, mult: 0 }, ...h.slice(0, 19)])
    } else {
      const newGemsFound = gemsFound + 1
      const newGrid = grid.map((t, idx) => idx === i ? { ...t, revealed: true, isGem: true } : t)
      setGrid(newGrid)
      setGemsFound(newGemsFound)

      if (newGemsFound === maxGems) {
        const mult = calcMultiplier(mineCount, newGemsFound)
        const payout = +(bet * mult).toFixed(2)
        addWin(payout)
        setGameActive(false)
        setGameOver(true)
        setLastResult({ won: true, amount: payout, mult })
        addBetHistory({ id: Date.now(), game: 'Mines', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
        addNotification(`💎 Board cleared! Won $${payout.toFixed(2)}!`, 'win')
        setHistory(h => [{ won: true, mult }, ...h.slice(0, 19)])
      }
    }
  }, [gameActive, grid, gameOver, bet, gemsFound, mineCount, maxGems, addWin, addBetHistory, addNotification])

  const cashOut = useCallback(() => {
    if (!gameActive || gemsFound === 0) return
    const payout = +(bet * currentMultiplier).toFixed(2)
    addWin(payout)
    const finalGrid = grid.map(t => t.isMine ? { ...t, revealed: true } : t)
    setGrid(finalGrid)
    setGameActive(false)
    setGameOver(true)
    setLastResult({ won: true, amount: payout, mult: currentMultiplier })
    addBetHistory({ id: Date.now(), game: 'Mines', bet: bet.toFixed(2), mult: currentMultiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
    addNotification(`💰 Cashed out $${payout.toFixed(2)} (${currentMultiplier.toFixed(2)}×)!`, 'win')
    setHistory(h => [{ won: true, mult: currentMultiplier }, ...h.slice(0, 19)])
  }, [gameActive, gemsFound, bet, currentMultiplier, grid, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Bomb size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Mines</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 10).map((h, i) => (
            <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${h.won ? 'bg-vault-green/20 text-vault-green border border-vault-green/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {h.won ? '💎' : '💥'}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        {/* Left panel */}
        <div className="panel space-y-5">
          <BetInput value={bet} onChange={setBet} disabled={gameActive} />

          {/* Mine count */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Mines — <span className="text-red-400">{mineCount}</span> of 25
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {PRESETS.map(n => (
                <button key={n} onClick={() => !gameActive && setMineCount(n)} disabled={gameActive}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    mineCount === n
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-vault-bg border border-vault-border text-gray-400 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50 disabled:pointer-events-none'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
            <input type="range" min={1} max={24} value={mineCount}
              onChange={e => !gameActive && setMineCount(+e.target.value)}
              disabled={gameActive}
              className="w-full accent-red-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-xs text-gray-600 px-0.5">
              <span>1 mine</span>
              <span>24 mines</span>
            </div>
          </div>

          {/* Live stats when playing */}
          {gameActive && (
            <div className="space-y-2">
              <div className="rounded-xl bg-gradient-to-r from-vault-green/10 to-transparent border border-vault-green/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Multiplier</span>
                  <TrendingUp size={12} className="text-vault-green" />
                </div>
                <div className="text-3xl font-black text-vault-green">{currentMultiplier.toFixed(2)}×</div>
                <div className="text-xs text-gray-500 mt-1">
                  Win: <span className="text-vault-green font-bold">${potentialPayout.toFixed(2)}</span>
                  {' '}· Profit: <span className="text-vault-green font-bold">+${(potentialPayout - bet).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="panel bg-vault-bg py-2">
                  <div className="text-gray-500">Gems</div>
                  <div className="font-black text-vault-green text-lg">{gemsFound}</div>
                </div>
                <div className="panel bg-vault-bg py-2">
                  <div className="text-gray-500">Mines</div>
                  <div className="font-black text-red-400 text-lg">{mineCount}</div>
                </div>
                <div className="panel bg-vault-bg py-2">
                  <div className="text-gray-500">Left</div>
                  <div className="font-black text-white text-lg">{maxGems - gemsFound}</div>
                </div>
              </div>
            </div>
          )}

          {/* Result display */}
          {lastResult && !gameActive && (
            <div className={`rounded-xl p-4 text-center border ${lastResult.won ? 'bg-vault-green/10 border-vault-green/30' : 'bg-red-900/20 border-red-500/30'}`}>
              {lastResult.won ? (
                <>
                  <div className="text-3xl mb-1">💰</div>
                  <div className="text-vault-green font-black text-2xl">+${(lastResult.amount - bet).toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{lastResult.mult?.toFixed(2)}× · Total ${lastResult.amount.toFixed(2)}</div>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-1">💥</div>
                  <div className="text-red-400 font-black text-xl">Mine Hit!</div>
                  <div className="text-xs text-gray-400">Lost ${bet.toFixed(2)}</div>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {gameActive ? (
              <>
                <button onClick={cashOut} disabled={gemsFound === 0}
                  className="btn-primary w-full py-3 font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed">
                  Cash Out ${potentialPayout.toFixed(2)}
                </button>
                <p className="text-xs text-center text-gray-600">
                  {gemsFound === 0 ? 'Reveal a gem to enable cash out' : `${gemsFound} gem${gemsFound > 1 ? 's' : ''} found — ${currentMultiplier.toFixed(2)}×`}
                </p>
              </>
            ) : (
              <button onClick={startGame} disabled={bet <= 0 || bet > balance}
                className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2">
                <Gem size={18} />
                {gameOver ? 'Play Again' : 'Start Game'}
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="panel">
          <div className="grid grid-cols-5 gap-2 h-full">
            {grid.map((tile, i) => (
              <Tile key={i} index={i} state={tile} onClick={() => revealTile(i)} gameActive={gameActive} />
            ))}
          </div>

          {/* Progress bar */}
          {gameActive && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress</span>
                <span>{gemsFound} / {maxGems} gems</span>
              </div>
              <div className="h-2 bg-vault-bg rounded-full overflow-hidden border border-vault-border">
                <div className="h-full bg-vault-green rounded-full transition-all duration-300"
                  style={{ width: `${(gemsFound / maxGems) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
