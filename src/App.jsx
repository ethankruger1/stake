import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Home from './pages/Home'
import Casino from './pages/Casino'
import Mines from './games/Mines'
import Crash from './games/Crash'
import Dice from './games/Dice'
import Plinko from './games/Plinko'
import Blackjack from './games/Blackjack'
import Roulette from './games/Roulette'
import Wheel from './games/Wheel'
import Hilo from './games/Hilo'
import Keno from './games/Keno'
import Limbo from './games/Limbo'
import Slots from './games/Slots'
import Baccarat from './games/Baccarat'
import Notifications from './components/UI/Notifications'
import { useState } from 'react'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-vault-bg overflow-hidden">
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/casino" element={<Casino />} />
                <Route path="/games/mines" element={<Mines />} />
                <Route path="/games/crash" element={<Crash />} />
                <Route path="/games/dice" element={<Dice />} />
                <Route path="/games/plinko" element={<Plinko />} />
                <Route path="/games/blackjack" element={<Blackjack />} />
                <Route path="/games/roulette" element={<Roulette />} />
                <Route path="/games/wheel" element={<Wheel />} />
                <Route path="/games/hilo" element={<Hilo />} />
                <Route path="/games/keno" element={<Keno />} />
                <Route path="/games/limbo" element={<Limbo />} />
                <Route path="/games/slots" element={<Slots />} />
                <Route path="/games/baccarat" element={<Baccarat />} />
              </Routes>
            </main>
          </div>
        </div>
        <Notifications />
      </BrowserRouter>
    </WalletProvider>
  )
}
