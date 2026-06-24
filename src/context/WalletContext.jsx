import { createContext, useContext, useState, useCallback } from 'react'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(1000.00)
  const [currency, setCurrency] = useState('USD')
  const [bets, setBets] = useState([])
  const [notifications, setNotifications] = useState([])

  const placeBet = useCallback((amount) => {
    if (amount > balance) return false
    setBalance(prev => +(prev - amount).toFixed(8))
    return true
  }, [balance])

  const addWin = useCallback((amount) => {
    setBalance(prev => +(prev + amount).toFixed(8))
  }, [])

  const addBetHistory = useCallback((bet) => {
    setBets(prev => [bet, ...prev].slice(0, 100))
  }, [])

  const addNotification = useCallback((msg, type = 'win') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, msg, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000)
  }, [])

  const currencies = ['USD', 'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'LTC']

  return (
    <WalletContext.Provider value={{
      balance,
      currency,
      setCurrency,
      currencies,
      placeBet,
      addWin,
      bets,
      addBetHistory,
      notifications,
      addNotification,
      setBalance,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
