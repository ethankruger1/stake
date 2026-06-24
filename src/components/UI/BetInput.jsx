import { useWallet } from '../../context/WalletContext'
import { DollarSign } from 'lucide-react'

export default function BetInput({ value, onChange, disabled }) {
  const { balance } = useWallet()

  const adjust = (factor) => {
    const next = Math.max(0.01, Math.min(balance, +(value * factor).toFixed(2)))
    onChange(next)
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
        Bet Amount
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={e => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
            disabled={disabled}
            className="input-field pl-8 font-bold"
          />
        </div>
        <button
          onClick={() => adjust(0.5)}
          disabled={disabled}
          className="btn-secondary text-xs px-2.5 py-2"
        >
          ½
        </button>
        <button
          onClick={() => adjust(2)}
          disabled={disabled}
          className="btn-secondary text-xs px-2.5 py-2"
        >
          2×
        </button>
        <button
          onClick={() => onChange(balance)}
          disabled={disabled}
          className="btn-secondary text-xs px-2.5 py-2"
        >
          Max
        </button>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-gray-500">Balance: <span className="text-gray-300">${balance.toFixed(2)}</span></span>
        {value > balance && <span className="text-xs text-red-400">Insufficient balance</span>}
      </div>
    </div>
  )
}
