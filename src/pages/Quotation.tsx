import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, DollarSign, CheckCircle, ArrowRight, Tag } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SCRIPT_TYPE_LABELS, DIFFICULTY_LABELS } from '@/types'
import type { Script } from '@/types'
import { generateQuotationItems, calculateTotal, getCategoryLabel } from '@/utils/quotation'
import { STORE_CONFIG } from '@/data/scripts'

const SCRIPT_TYPE_COLORS: Record<string, string> = {
  joy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  emotion: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  terror: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  reasoning: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  mechanism: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
}

export default function Quotation() {
  const navigate = useNavigate()
  const currentInquiryId = useAppStore((s) => s.currentInquiryId)
  const inquiries = useAppStore((s) => s.inquiries)
  const getAvailableScripts = useAppStore((s) => s.getAvailableScripts)
  const occupiedSlots = useAppStore((s) => s.occupiedSlots)
  const addQuotation = useAppStore((s) => s.addQuotation)
  const occupySlot = useAppStore((s) => s.occupySlot)

  const [selectedScripts, setSelectedScripts] = useState<Script[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)

  const inquiry = useMemo(
    () => inquiries.find((i) => i.id === currentInquiryId) ?? null,
    [inquiries, currentInquiryId]
  )

  const availableScripts = useMemo(
    () =>
      inquiry
        ? getAvailableScripts(inquiry.guestCount, inquiry.ageGroup, inquiry.roomType)
        : [],
    [inquiry, getAvailableScripts]
  )

  const occupiedForDate = useMemo(() => {
    if (!inquiry) return []
    return occupiedSlots[inquiry.date] || []
  }, [occupiedSlots, inquiry])

  const items = useMemo(
    () => (inquiry && selectedScripts.length > 0 ? generateQuotationItems(inquiry, selectedScripts) : []),
    [inquiry, selectedScripts]
  )

  const totalPrice = useMemo(() => calculateTotal(items, discount), [items, discount])

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {}
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [items])

  function toggleScript(script: Script) {
    setSelectedScripts((prev) =>
      prev.some((s) => s.id === script.id) ? prev.filter((s) => s.id !== script.id) : [...prev, script]
    )
  }

  function handleConfirm() {
    if (!inquiry || !selectedSlot || selectedScripts.length === 0) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const quotation = {
      id,
      inquiryId: inquiry.id,
      selectedScripts,
      timeSlot: selectedSlot,
      items,
      discount,
      totalPrice,
      confirmed: true,
      createdAt: new Date().toISOString(),
    }
    addQuotation(quotation)
    occupySlot(inquiry.date, selectedSlot)
    navigate('/checklist')
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-gray-500" />
          <p className="text-gray-400 text-lg" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            请先前往咨询页面创建咨询单
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
          >
            前往咨询页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}>
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
      >
        报价方案
      </h1>

      <div className="flex gap-6">
        <div className="w-2/3 space-y-6">
          <section>
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              <BookOpen className="w-5 h-5" />
              剧本推荐
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
              {availableScripts.map((script) => {
                const isSelected = selectedScripts.some((s) => s.id === script.id)
                return (
                  <button
                    key={script.id}
                    onClick={() => toggleScript(script)}
                    className="flex-shrink-0 w-52 rounded-xl p-4 text-left transition-all border-2"
                    style={{
                      backgroundColor: isSelected ? 'rgba(226,160,74,0.1)' : 'rgba(255,255,255,0.04)',
                      borderColor: isSelected ? '#e2a04a' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm truncate">{script.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${SCRIPT_TYPE_COLORS[script.type]}`}
                      >
                        {SCRIPT_TYPE_LABELS[script.type]}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{script.minPlayers}-{script.maxPlayers}人</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{script.duration}小时</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{DIFFICULTY_LABELS[script.difficulty]}</span>
                        <span style={{ color: '#e2a04a' }}>¥{script.pricePerPerson}/人</span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {availableScripts.length === 0 && (
                <div className="text-gray-500 text-sm py-8 w-full text-center">
                  当前条件没有匹配的剧本
                </div>
              )}
            </div>
          </section>

          <section>
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              <Clock className="w-5 h-5" />
              时间段选择
              {inquiry.date && <span className="text-sm text-gray-400 font-normal ml-2">{inquiry.date}</span>}
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {STORE_CONFIG.timeSlots.map((slot) => {
                const isOccupied = occupiedForDate.includes(slot)
                const isSelected = selectedSlot === slot
                let bgColor = 'rgba(51,184,154,0.15)'
                let borderColor = 'rgba(51,184,154,0.4)'
                let textColor = '#33b89a'
                let label = '可预约'
                if (isOccupied) {
                  bgColor = 'rgba(200,75,49,0.15)'
                  borderColor = 'rgba(200,75,49,0.4)'
                  textColor = '#c84b31'
                  label = '已占用'
                } else if (isSelected) {
                  bgColor = 'rgba(226,160,74,0.15)'
                  borderColor = '#e2a04a'
                  textColor = '#e2a04a'
                  label = '已选择'
                }
                return (
                  <button
                    key={slot}
                    onClick={() => !isOccupied && setSelectedSlot(isSelected ? null : slot)}
                    disabled={isOccupied}
                    className="rounded-lg p-3 border-2 text-center transition-all"
                    style={{ backgroundColor: bgColor, borderColor, opacity: isOccupied ? 0.6 : 1 }}
                  >
                    <div className="font-bold text-sm" style={{ color: textColor }}>{slot}</div>
                    <div className="text-xs mt-1" style={{ color: textColor }}>{label}</div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="w-1/3 space-y-6">
          <section
            className="rounded-xl p-4 border"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              <DollarSign className="w-5 h-5" />
              费用明细
            </h2>

            {items.length === 0 ? (
              <div className="text-gray-500 text-sm py-6 text-center">请先选择剧本</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                  <div key={category}>
                    <div
                      className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
                      style={{ color: '#e2a04a', borderColor: 'rgba(226,160,74,0.2)' }}
                    >
                      {getCategoryLabel(category as never)}
                    </div>
                    <div className="space-y-1">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 truncate mr-2">{item.name}</span>
                          <span className="text-gray-400 whitespace-nowrap">
                            ¥{item.unitPrice} × {item.quantity} = <span className="text-white">¥{item.subtotal}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="rounded-xl p-4 border"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" style={{ color: '#e2a04a' }} />
              <label className="text-sm text-gray-300">优惠减免</label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">¥</span>
              <input
                type="number"
                min={0}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                className="flex-1 rounded-lg px-3 py-2 text-white text-sm outline-none border transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                placeholder="0"
              />
            </div>
          </section>

          <section
            className="rounded-xl p-4 border text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="text-sm text-gray-400 mb-1">合计金额</div>
            <div
              className="text-4xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              ¥{totalPrice}
            </div>
            {discount > 0 && (
              <div className="text-xs text-gray-500 mt-1">已优惠 ¥{discount}</div>
            )}
          </section>

          <button
            onClick={handleConfirm}
            disabled={selectedScripts.length === 0 || !selectedSlot}
            className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: selectedScripts.length > 0 && selectedSlot ? '#e2a04a' : 'rgba(226,160,74,0.3)',
              color: '#0f0f1a',
              cursor: selectedScripts.length > 0 && selectedSlot ? 'pointer' : 'not-allowed',
            }}
          >
            <CheckCircle className="w-5 h-5" />
            确认报价，生成执行清单
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
