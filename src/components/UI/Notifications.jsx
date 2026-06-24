import { useWallet } from '../../context/WalletContext'
import { CheckCircle, XCircle } from 'lucide-react'

export default function Notifications() {
  const { notifications } = useWallet()

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map(({ id, msg, type }) => (
        <div
          key={id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold animate-slide-in ${
            type === 'win'
              ? 'bg-green-900/90 border-vault-green text-vault-green'
              : 'bg-red-900/90 border-red-500 text-red-400'
          }`}
        >
          {type === 'win' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {msg}
        </div>
      ))}
    </div>
  )
}
