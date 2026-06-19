import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  BookOpen,
  DollarSign,
  Tag,
  Users,
  DoorOpen,
  CheckCircle,
  ArrowRight,
  Save,
  Wallet,
  CreditCard,
} from 'lucide-react'
import { useAppStore, STORE_CONFIG } from '@/store/useAppStore'
import type { Script, RoomType, PaymentMethod } from '@/types'
import { SCRIPT_TYPE_LABELS, DIFFICULTY_LABELS, ROOM_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types'
import { generateQuotationItems, calculateTotal, getCategoryLabel } from '@/utils/quotation'
import { shiftChecklistTime, parseTimeToMinutes, sortTasksByTime } from '@/utils/checklist'

const SCRIPT_TYPE_COLORS: Record<string, string> = {
  joy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  emotion: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  terror: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  reasoning: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  mechanism: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
}

const ROOM_TYPE_ORDER: RoomType[] = ['small', 'medium', 'large']

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['cash', 'wechat', 'alipay', 'card', 'bank']

export default function Quotation() {
  const navigate = useNavigate()
  const currentInquiryId = useAppStore((s) => s.currentInquiryId)
  const inquiries = useAppStore((s) => s.inquiries)
  const quotations = useAppStore((s) => s.quotations)
  const checklists = useAppStore((s) => s.checklists)
  const getAvailableScripts = useAppStore((s) => s.getAvailableScripts)
  const getSuitableRoomType = useAppStore((s) => s.getSuitableRoomType)
  const occupiedSlots = useAppStore((s) => s.occupiedSlots)
  const addQuotation = useAppStore((s) => s.addQuotation)
  const updateQuotation = useAppStore((s) => s.updateQuotation)
  const confirmQuotation = useAppStore((s) => s.confirmQuotation)
  const updateInquiry = useAppStore((s) => s.updateInquiry)
  const occupySlot = useAppStore((s) => s.occupySlot)
  const releaseSlot = useAppStore((s) => s.releaseSlot)
  const replaceAllTasks = useAppStore((s) => s.replaceAllTasks)

  const inquiry = useMemo(
    () => inquiries.find((i) => i.id === currentInquiryId) ?? null,
    [inquiries, currentInquiryId]
  )

  const existingQuotation = useMemo(
    () => quotations.find((q) => q.inquiryId === currentInquiryId) ?? null,
    [quotations, currentInquiryId]
  )

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedScripts, setSelectedScripts] = useState<Script[]>([])
  const [discount, setDiscount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [initialSlotOccupied, setInitialSlotOccupied] = useState(false)
  const [depositAmount, setDepositAmount] = useState(0)
  const [depositMethod, setDepositMethod] = useState<PaymentMethod | ''>('')

  useEffect(() => {
    if (!inquiry) return
    setSelectedDate(inquiry.date)
    if (existingQuotation) {
      setSelectedSlot(existingQuotation.timeSlot)
      setSelectedScripts(existingQuotation.selectedScripts)
      setDiscount(existingQuotation.discount)
      setDepositAmount(existingQuotation.depositAmount ?? 0)
      setDepositMethod(existingQuotation.depositMethod ?? '')
      setIsEditing(true)
    } else if (inquiry.timeSlot) {
      setSelectedSlot(inquiry.timeSlot)
    }
  }, [inquiry, existingQuotation])

  useEffect(() => {
    if (!inquiry || !selectedSlot || initialSlotOccupied) return
    if (isEditing) {
      setInitialSlotOccupied(true)
      return
    }
    const occupied = occupiedSlots[selectedDate] || []
    if (!occupied.includes(selectedSlot)) {
      occupySlot(selectedDate, selectedSlot)
    }
    setInitialSlotOccupied(true)
  }, [selectedSlot, selectedDate, inquiry, isEditing, initialSlotOccupied, occupiedSlots, occupySlot])

  const suitableRoomType = useMemo(
    () => (inquiry ? getSuitableRoomType(inquiry.guestCount) : 'small'),
    [inquiry, getSuitableRoomType]
  )

  const allMatchingScripts = useMemo(
    () => (inquiry ? getAvailableScripts(inquiry.guestCount, inquiry.ageGroup) : []),
    [inquiry, getAvailableScripts]
  )

  const scriptsByRoomType = useMemo(() => {
    const groups: Record<RoomType, Script[]> = { small: [], medium: [], large: [] }
    allMatchingScripts.forEach((script) => {
      groups[script.roomRequirement].push(script)
    })
    return groups
  }, [allMatchingScripts])

  const occupiedForDate = useMemo(() => {
    return occupiedSlots[selectedDate] || []
  }, [occupiedSlots, selectedDate])

  const items = useMemo(
    () =>
      inquiry && selectedScripts.length > 0
        ? generateQuotationItems(inquiry, selectedScripts)
        : [],
    [inquiry, selectedScripts]
  )

  const totalPrice = useMemo(() => calculateTotal(items, discount), [items, discount])
  const remainingBalance = useMemo(() => Math.max(0, totalPrice - depositAmount), [totalPrice, depositAmount])

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {}
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [items])

  function getRoomsForScript(script: Script) {
    return STORE_CONFIG.rooms.filter((room) => {
      if (script.roomRequirement === 'small') return true
      if (script.roomRequirement === 'medium') return room.type !== 'small'
      if (script.roomRequirement === 'large') return room.type === 'large'
      return false
    })
  }

  function toggleScript(script: Script) {
    setSelectedScripts((prev) =>
      prev.some((s) => s.id === script.id)
        ? prev.filter((s) => s.id !== script.id)
        : [...prev, script]
    )
  }

  function shiftChecklistIfNeeded(oldSlot: string | null, newSlot: string) {
    if (!existingQuotation || !oldSlot) return
    const checklist = checklists.find((c) => c.quotationId === existingQuotation.id)
    if (!checklist || checklist.tasks.length === 0) return
    const oldBaseMinutes = parseTimeToMinutes(oldSlot)
    const newBaseMinutes = parseTimeToMinutes(newSlot)
    if (oldBaseMinutes === newBaseMinutes) return
    const shifted = shiftChecklistTime(checklist.tasks, oldBaseMinutes, newBaseMinutes)
    const sorted = sortTasksByTime(shifted)
    replaceAllTasks(checklist.id, sorted)
  }

  function handleSlotClick(slot: string) {
    if (occupiedForDate.includes(slot) && selectedSlot !== slot) return
    if (selectedSlot === slot) return
    const oldSlot = selectedSlot
    if (selectedSlot) {
      releaseSlot(selectedDate, selectedSlot)
    }
    setSelectedSlot(slot)
    occupySlot(selectedDate, slot)
    shiftChecklistIfNeeded(oldSlot, slot)
    if (inquiry) {
      updateInquiry(inquiry.id, { timeSlot: slot })
    }
  }

  function handleDateChange(date: string) {
    if (!date || !inquiry) return
    const oldDate = selectedDate
    const oldSlot = selectedSlot
    setSelectedDate(date)
    if (oldSlot && oldDate) {
      releaseSlot(oldDate, oldSlot)
    }
    const newOccupied = occupiedSlots[date] || []
    if (oldSlot && !newOccupied.includes(oldSlot)) {
      occupySlot(date, oldSlot)
    } else if (oldSlot && newOccupied.includes(oldSlot)) {
      setSelectedSlot(null)
    }
    updateInquiry(inquiry.id, { date })
  }

  function handleConfirm() {
    if (!inquiry || !selectedSlot || selectedScripts.length === 0) return
    if (isEditing && existingQuotation) {
      updateQuotation(existingQuotation.id, {
        selectedScripts,
        timeSlot: selectedSlot,
        items,
        discount,
        totalPrice,
        depositAmount,
        depositMethod,
      })
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
      const quotation = {
        id,
        inquiryId: inquiry.id,
        selectedScripts,
        timeSlot: selectedSlot,
        items,
        discount,
        totalPrice,
        confirmed: false,
        depositAmount: 0,
        depositMethod: '' as const,
        finalPaid: false,
        finalPaymentMethod: '' as const,
        createdAt: new Date().toISOString(),
      }
      addQuotation(quotation)
      if (depositMethod) {
        confirmQuotation(id, depositAmount, depositMethod)
      } else {
        confirmQuotation(id, depositAmount)
      }
      occupySlot(selectedDate, selectedSlot)
    }
    navigate('/checklist')
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-gray-500" />
          <p className="text-gray-400 text-lg" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            请先前往询价录入页面创建询价单
          </p>
          <button
            onClick={() => navigate('/inquiry')}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
          >
            前往询价录入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
        >
          {isEditing ? '编辑报价' : '报价方案'}
        </h1>
        {isEditing && (
          <span
            className="text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(226,160,74,0.15)',
              color: '#e2a04a',
              border: '1px solid rgba(226,160,74,0.3)',
            }}
          >
            编辑模式
          </span>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-2/3 space-y-6">
          <section
            className="rounded-xl p-4 border"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <h2
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              <Calendar className="w-5 h-5" />
              档期视图
            </h2>

            <div className="flex items-center gap-6 mb-4 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-lg px-3 py-2 text-white text-sm outline-none border transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{inquiry.customerName}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400">{inquiry.guestCount}人</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DoorOpen className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">
                  推荐：
                  <span style={{ color: '#e2a04a' }}>
                    {suitableRoomType === 'mixed' ? '多房组合' : ROOM_TYPE_LABELS[suitableRoomType as RoomType]}
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {STORE_CONFIG.timeSlots.map((slot) => {
                const isOccupied = occupiedForDate.includes(slot) && selectedSlot !== slot
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
                  bgColor = 'rgba(226,160,74,0.2)'
                  borderColor = '#e2a04a'
                  textColor = '#e2a04a'
                  label = '已选择'
                }
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isOccupied}
                    className="rounded-lg p-3 border-2 text-center transition-all"
                    style={{
                      backgroundColor: bgColor,
                      borderColor,
                      opacity: isOccupied ? 0.5 : 1,
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: textColor }} />
                    <div className="font-bold text-sm" style={{ color: textColor }}>
                      {slot}
                    </div>
                    <div className="text-xs mt-1" style={{ color: textColor }}>
                      {label}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <h2
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              <BookOpen className="w-5 h-5" />
              剧本推荐
            </h2>

            <div className="space-y-6">
              {ROOM_TYPE_ORDER.map((roomType) => {
                const scripts = scriptsByRoomType[roomType]
                const isRecommended =
                  suitableRoomType === roomType ||
                  (suitableRoomType === 'mixed' && roomType === 'large')
                if (scripts.length === 0) return null
                return (
                  <div key={roomType}>
                    <div className="flex items-center gap-2 mb-3">
                      <DoorOpen className="w-4 h-4" style={{ color: isRecommended ? '#e2a04a' : '#6b7280' }} />
                      <span
                        className="text-sm font-bold"
                        style={{ color: isRecommended ? '#e2a04a' : '#9ca3af' }}
                      >
                        {ROOM_TYPE_LABELS[roomType]}
                      </span>
                      {isRecommended && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'rgba(226,160,74,0.2)',
                            color: '#e2a04a',
                          }}
                        >
                          推荐
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        ({scripts.length}个剧本)
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {scripts.map((script) => {
                        const isSelected = selectedScripts.some((s) => s.id === script.id)
                        const rooms = getRoomsForScript(script)
                        return (
                          <button
                            key={script.id}
                            onClick={() => toggleScript(script)}
                            className="flex-shrink-0 w-56 rounded-xl p-4 text-left transition-all border-2"
                            style={{
                              backgroundColor: isSelected
                                ? 'rgba(226,160,74,0.1)'
                                : 'rgba(255,255,255,0.04)',
                              borderColor: isSelected ? '#e2a04a' : 'rgba(255,255,255,0.08)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white text-sm truncate">
                                {script.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${SCRIPT_TYPE_COLORS[script.type]}`}
                              >
                                {SCRIPT_TYPE_LABELS[script.type]}
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>
                                  {script.minPlayers}-{script.maxPlayers}人
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{script.duration}小时</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">
                                  {DIFFICULTY_LABELS[script.difficulty]}
                                </span>
                                <span style={{ color: '#e2a04a' }}>
                                  ¥{script.pricePerPerson}/人
                                </span>
                              </div>
                              <div className="pt-1.5 mt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <DoorOpen className="w-3 h-3" />
                                  <span className="truncate">
                                    {rooms.map((r) => r.name).join('、')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {allMatchingScripts.length === 0 && (
                <div
                  className="text-gray-500 text-sm py-8 w-full text-center rounded-xl border"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  当前条件没有匹配的剧本
                </div>
              )}
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
                          <span className="text-gray-400 whitespace-nowrap text-xs">
                            ¥{item.unitPrice} × {item.quantity} ={' '}
                            <span className="text-white">¥{item.subtotal}</span>
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

          <section
            className="rounded-xl p-4 border"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: '#e2a04a' }}
            >
              <Wallet className="w-5 h-5" />
              定金与支付
            </h2>

            {isEditing && existingQuotation?.finalPaid && (
              <div
                className="mb-3 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(51,184,154,0.1)',
                  border: '1px solid rgba(51,184,154,0.3)',
                  color: '#33b89a',
                }}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                尾款已结清 ({existingQuotation.finalPaymentMethod ? PAYMENT_METHOD_LABELS[existingQuotation.finalPaymentMethod] : ''})
              </div>
            )}

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4" style={{ color: '#e2a04a' }} />
                  <label className="text-sm text-gray-300">定金金额</label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">¥</span>
                  <input
                    type="number"
                    min={0}
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 rounded-lg px-3 py-2 text-white text-sm outline-none border transition-colors"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" style={{ color: '#e2a04a' }} />
                  <label className="text-sm text-gray-300">支付方式</label>
                </div>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value as PaymentMethod | '')}
                  className="w-full rounded-lg px-3 py-2 text-white text-sm outline-none border transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1a1a2e' }}>请选择支付方式</option>
                  {PAYMENT_METHOD_OPTIONS.map((method) => (
                    <option key={method} value={method} style={{ backgroundColor: '#1a1a2e' }}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="pt-3 mt-3 border-t flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <span className="text-sm text-gray-400">剩余尾款</span>
                <span
                  className="text-xl font-bold"
                  style={{ fontFamily: "'ZCOOL QingKe HuangYou', sans-serif", color: remainingBalance > 0 ? '#e2a04a' : '#33b89a' }}
                >
                  ¥{remainingBalance}
                </span>
              </div>
            </div>
          </section>

          <button
            onClick={handleConfirm}
            disabled={selectedScripts.length === 0 || !selectedSlot}
            className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor:
                selectedScripts.length > 0 && selectedSlot ? '#e2a04a' : 'rgba(226,160,74,0.3)',
              color: '#0f0f1a',
              cursor: selectedScripts.length > 0 && selectedSlot ? 'pointer' : 'not-allowed',
            }}
          >
            {isEditing ? (
              <>
                <Save className="w-5 h-5" />
                保存修改
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                确认报价，生成执行清单
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
