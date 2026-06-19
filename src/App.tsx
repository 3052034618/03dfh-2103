import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Clapperboard, ClipboardList, FileText, PartyPopper } from 'lucide-react'
import Inquiry from '@/pages/Inquiry'
import Quotation from '@/pages/Quotation'
import Checklist from '@/pages/Checklist'

const NAV_ITEMS = [
  { path: '/inquiry', label: '询价录入', icon: ClipboardList },
  { path: '/quotation', label: '套餐报价', icon: FileText },
  { path: '/checklist', label: '执行清单', icon: Clapperboard },
]

function TopNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', borderBottom: '1px solid rgba(226,160,74,0.15)' }}>
      <div className="flex items-center gap-3 mr-10">
        <PartyPopper size={28} style={{ color: '#e2a04a' }} />
        <span className="text-xl font-bold tracking-wide" style={{ fontFamily: '"ZCOOL QingKe HuangYou", cursive', color: '#e2a04a' }}>
          剧本杀生日包场接待
        </span>
      </div>
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: isActive ? 'rgba(226,160,74,0.15)' : 'transparent',
                color: isActive ? '#e2a04a' : '#8b8ba3',
                boxShadow: isActive ? '0 0 20px rgba(226,160,74,0.1)' : 'none',
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#0f0f1a' }}>
      <TopNav />
      <main className="pt-16 min-h-screen">
        <Routes>
          <Route path="/inquiry" element={<Inquiry />} />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/" element={<Navigate to="/inquiry" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}
