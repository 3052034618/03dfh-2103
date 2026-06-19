import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  Clock,
  FileText,
  Clapperboard,
  PartyPopper,
  ChevronRight,
  Phone,
  DoorOpen,
  X,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  AGE_GROUP_LABELS,
  SCRIPT_TYPE_LABELS,
  DIFFICULTY_LABELS,
  ROOM_TYPE_LABELS,
} from '@/types'
import type { OrderStatus, InquiryData, QuotationData, ChecklistData } from '@/types'
import { computeOrderStatus, getNextPendingTask } from '@/utils/checklist'

interface BookingBase {
  inquiry: InquiryData
  quotation: QuotationData
  checklist?: ChecklistData
}

interface BookingWithStatus extends BookingBase {
  status: OrderStatus
}

const TAB_FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'not_started',
  'in_progress',
  'wrapping_up',
  'completed',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const getTodayConfirmed = useAppStore((s) => s.getTodayConfirmed)
  const setCurrentInquiryId = useAppStore((s) => s.setCurrentInquiryId)
  const setCurrentQuotationId = useAppStore((s) => s.setCurrentQuotationId)
  const setCurrentChecklistId = useAppStore((s) => s.setCurrentChecklistId)

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithStatus | null>(null)

  const todayBookings: BookingBase[] = useMemo(
    () => getTodayConfirmed(selectedDate) as BookingBase[],
    [getTodayConfirmed, selectedDate]
  )

  const bookingsWithStatus: BookingWithStatus[] = useMemo(
    () =>
      todayBookings.map((b) => ({
        ...b,
        status: computeOrderStatus(b.checklist, b.quotation),
      })),
    [todayBookings]
  )

  const tabCounts = useMemo(() => {
    const counts: Record<OrderStatus | 'all', number> = {
      all: bookingsWithStatus.length,
      not_started: 0,
      in_progress: 0,
      wrapping_up: 0,
      completed: 0,
    }
    bookingsWithStatus.forEach((b) => {
      counts[b.status]++
    })
    return counts
  }, [bookingsWithStatus])

  const filteredBookings = useMemo(() => {
    const filtered =
      activeTab === 'all'
        ? bookingsWithStatus
        : bookingsWithStatus.filter((b) => b.status === activeTab)
    return [...filtered].sort((a, b) =>
      a.quotation.timeSlot.localeCompare(b.quotation.timeSlot)
    )
  }, [bookingsWithStatus, activeTab])

  const totalGuests = useMemo(
    () => bookingsWithStatus.reduce((sum, b) => sum + b.inquiry.guestCount, 0),
    [bookingsWithStatus]
  )

  const completedTasks = useMemo(
    () =>
      bookingsWithStatus.reduce((sum, b) => {
        if (!b.checklist) return sum
        return sum + b.checklist.tasks.filter((t) => t.status === 'done').length
      }, 0),
    [bookingsWithStatus]
  )

  const totalTasks = useMemo(
    () =>
      bookingsWithStatus.reduce((sum, b) => {
        if (!b.checklist) return sum
        return sum + b.checklist.tasks.length
      }, 0),
    [bookingsWithStatus]
  )

  const goToQuotation = (booking: BookingWithStatus) => {
    setCurrentInquiryId(booking.inquiry.id)
    setCurrentQuotationId(booking.quotation.id)
    navigate('/quotation')
  }

  const goToChecklist = (booking: BookingWithStatus) => {
    setCurrentInquiryId(booking.inquiry.id)
    setCurrentQuotationId(booking.quotation.id)
    if (booking.checklist) {
      setCurrentChecklistId(booking.checklist.id)
    }
    navigate('/checklist')
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  }

  const getTabLabel = (tab: OrderStatus | 'all') => {
    if (tab === 'all') return '全部'
    return ORDER_STATUS_LABELS[tab]
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
            >
              <PartyPopper className="mb-1 mr-3 inline-block" size={32} />
              今日包场总览
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#8b8ba3' }}>
              查看当天所有生日包场订单及执行进度
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: '#8b8ba3' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: '#16162a',
                  borderColor: '#2a2a40',
                  color: '#e2e2f0',
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              当日订单
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
            >
              {bookingsWithStatus.length} 单
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              预计接待人数
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#33b89a' }}
            >
              {totalGuests} 人
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              任务完成进度
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{
                fontFamily: "'ZCOOL QingKe HuangYou', cursive",
                color: totalTasks > 0 && completedTasks === totalTasks ? '#33b89a' : '#e2a04a',
              }}
            >
              {completedTasks}/{totalTasks} 项
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2e2f0' }}
            >
              {formatDate(selectedDate)} 排期
            </h2>
            <div className="text-xs" style={{ color: '#6a6a80' }}>
              按时段排序
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {TAB_FILTERS.map((tab) => {
              const isActive = activeTab === tab
              const statusColors = tab !== 'all' ? ORDER_STATUS_COLORS[tab] : null
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all"
                  style={{
                    backgroundColor: isActive ? (statusColors ? undefined : '#e2a04a') : 'transparent',
                    borderColor: isActive
                      ? statusColors
                        ? undefined
                        : '#e2a04a'
                      : '#2a2a40',
                    color: isActive ? (statusColors ? undefined : '#0f0f1a') : '#8b8ba3',
                    ...(isActive && statusColors
                      ? {
                          backgroundColor: 'rgba(226, 160, 74, 0.15)',
                          borderColor: 'rgba(226, 160, 74, 0.5)',
                          color: '#e2a04a',
                        }
                      : {}),
                  }}
                >
                  <span>{getTabLabel(tab)}</span>
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: isActive
                        ? tab === 'all'
                          ? 'rgba(15, 15, 26, 0.3)'
                          : 'rgba(255,255,255,0.15)'
                        : '#2a2a40',
                      color: isActive ? (tab === 'all' ? '#e2a04a' : '#e2e2f0') : '#6a6a80',
                    }}
                  >
                    {tabCounts[tab]}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center">
              <PartyPopper
                size={48}
                className="mx-auto mb-3 opacity-30"
                style={{ color: '#e2a04a' }}
              />
              <p className="text-sm" style={{ color: '#6a6a80' }}>
                当天暂无生日包场订单
              </p>
              <button
                onClick={() => navigate('/inquiry')}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
              >
                新建询价
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const doneCount = booking.checklist
                  ? booking.checklist.tasks.filter((t) => t.status === 'done').length
                  : 0
                const totalCount = booking.checklist
                  ? booking.checklist.tasks.length
                  : 0
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0
                const depositAmount = booking.quotation.depositAmount || 0
                const showFinalUnpaid =
                  !booking.quotation.finalPaid &&
                  (booking.status === 'completed' || booking.status === 'in_progress' || booking.status === 'wrapping_up')

                return (
                  <div
                    key={booking.quotation.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="cursor-pointer rounded-xl border p-4 transition-all hover:border-amber-500/40"
                    style={{
                      backgroundColor: '#0f0f1a',
                      borderColor: '#2a2a40',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 rounded-lg px-3 py-2 text-center"
                        style={{ backgroundColor: '#e2a04a22' }}
                      >
                        <div
                          className="text-lg font-bold"
                          style={{
                            fontFamily: "'ZCOOL QingKe HuangYou', cursive",
                            color: '#e2a04a',
                          }}
                        >
                          {booking.quotation.timeSlot}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3
                            className="text-base font-semibold truncate"
                            style={{ color: '#e2e2f0' }}
                          >
                            {booking.inquiry.customerName}
                            <span
                              className="ml-2 text-xs font-normal"
                              style={{ color: '#6a6a80' }}
                            >
                              的生日派对
                            </span>
                          </h3>
                          <span
                            className="flex-shrink-0 rounded-full border px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: 'rgba(226, 160, 74, 0.1)',
                              borderColor: 'rgba(226, 160, 74, 0.3)',
                              color: '#e2a04a',
                            }}
                          >
                            {ORDER_STATUS_LABELS[booking.status]}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span
                            className="flex items-center gap-1"
                            style={{ color: '#8b8ba3' }}
                          >
                            <Users size={12} />
                            {booking.inquiry.guestCount}人
                          </span>
                          <span
                            className="flex items-center gap-1"
                            style={{ color: '#8b8ba3' }}
                          >
                            <Clock size={12} />
                            {booking.quotation.selectedScripts
                              .reduce((s, sc) => s + sc.duration, 0)
                              .toFixed(1)}
                            小时
                          </span>
                          {booking.inquiry.needPrivateRoom && (
                            <span
                              className="inline-block rounded px-1.5 py-0.5 text-[10px]"
                              style={{ backgroundColor: '#33b89a22', color: '#33b89a' }}
                            >
                              独立包间
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {booking.quotation.selectedScripts.map((s) => (
                            <span
                              key={s.id}
                              className="rounded px-2 py-0.5 text-xs"
                              style={{
                                backgroundColor: '#2a2a40',
                                color: '#a0a0b8',
                              }}
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {depositAmount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px]"
                              style={{ backgroundColor: '#33b89a22', color: '#33b89a' }}
                            >
                              <CheckCircle size={10} />
                              已收订金 ¥{depositAmount}
                            </span>
                          )}
                          {showFinalUnpaid && (
                            <span
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: '#c84b3122', color: '#c84b31' }}
                            >
                              <AlertCircle size={10} />
                              未收尾款
                            </span>
                          )}
                        </div>

                        {booking.checklist && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span style={{ color: '#6a6a80' }}>执行进度</span>
                              <span style={{ color: '#8b8ba3' }}>
                                {doneCount}/{totalCount} 项
                              </span>
                            </div>
                            <div
                              className="h-1.5 w-full rounded-full overflow-hidden"
                              style={{ backgroundColor: '#2a2a40' }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor:
                                    progress === 100 ? '#33b89a' : '#e2a04a',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            goToQuotation(booking)
                          }}
                          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
                          style={{ borderColor: '#2a2a40', color: '#8b8ba3' }}
                        >
                          <FileText size={12} />
                          报价
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            goToChecklist(booking)
                          }}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ backgroundColor: '#e2a04a22', color: '#e2a04a' }}
                        >
                          <Clapperboard size={12} />
                          清单
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/inquiry')}
            className="rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
          >
            <PartyPopper className="mb-0.5 mr-2 inline-block" size={16} />
            新建生日包场咨询
          </button>
        </div>
      </div>

      {selectedBooking && (
        <>
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setSelectedBooking(null)}
          />
          <div
            className="fixed right-0 top-0 z-50 h-full overflow-y-auto shadow-2xl transition-transform duration-300"
            style={{
              width: '420px',
              backgroundColor: '#16162a',
              transform: 'translateX(0)',
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-start justify-between border-b p-5"
              style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
            >
              <div className="min-w-0 flex-1 pr-3">
                <h2
                  className="text-2xl font-bold truncate"
                  style={{
                    fontFamily: "'ZCOOL QingKe HuangYou', cursive",
                    color: '#e2e2f0',
                  }}
                >
                  {selectedBooking.inquiry.customerName}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: '#8b8ba3' }}>
                  <Calendar size={14} />
                  <span>{formatDate(selectedBooking.inquiry.date)}</span>
                  <span>·</span>
                  <Clock size={14} />
                  <span>{selectedBooking.quotation.timeSlot}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs"
                    style={{
                      backgroundColor: 'rgba(226, 160, 74, 0.1)',
                      borderColor: 'rgba(226, 160, 74, 0.3)',
                      color: '#e2a04a',
                    }}
                  >
                    {ORDER_STATUS_LABELS[selectedBooking.status]}
                  </span>
                  {!selectedBooking.quotation.finalPaid && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: '#c84b3122', color: '#c84b31' }}
                    >
                      <AlertCircle size={12} />
                      {selectedBooking.status === 'wrapping_up' || selectedBooking.status === 'completed'
                        ? '待收尾'
                        : '未收尾尾款'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#8b8ba3' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
                >
                  客户信息
                </h3>
                <div
                  className="space-y-2.5 rounded-xl border p-4"
                  style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#2a2a40' }}
                    >
                      <Phone size={14} style={{ color: '#e2a04a' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs" style={{ color: '#6a6a80' }}>
                        联系电话
                      </div>
                      <a
                        href={`tel:${selectedBooking.inquiry.customerPhone}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#e2e2f0' }}
                      >
                        {selectedBooking.inquiry.customerPhone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#2a2a40' }}
                    >
                      <Users size={14} style={{ color: '#e2a04a' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs" style={{ color: '#6a6a80' }}>
                        年龄层
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#e2e2f0' }}>
                        {AGE_GROUP_LABELS[selectedBooking.inquiry.ageGroup]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#2a2a40' }}
                    >
                      <Users size={14} style={{ color: '#33b89a' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs" style={{ color: '#6a6a80' }}>
                        参与人数
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#e2e2f0' }}>
                        {selectedBooking.inquiry.guestCount} 人
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#2a2a40' }}
                    >
                      <DoorOpen size={14} style={{ color: '#33b89a' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs" style={{ color: '#6a6a80' }}>
                        房间需求
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#e2e2f0' }}>
                        {ROOM_TYPE_LABELS[selectedBooking.inquiry.roomType]}
                        {selectedBooking.inquiry.needPrivateRoom && (
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                            style={{ backgroundColor: '#33b89a22', color: '#33b89a' }}
                          >
                            独立包间
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedBooking.inquiry.notes && (
                    <div className="mt-2">
                      <div className="mb-1 text-xs" style={{ color: '#6a6a80' }}>
                        备注
                      </div>
                      <div
                        className="rounded-lg border px-3 py-2.5 text-sm"
                        style={{
                          backgroundColor: 'rgba(226, 160, 74, 0.06)',
                          borderColor: 'rgba(226, 160, 74, 0.2)',
                          color: '#c8c8d8',
                        }}
                      >
                        {selectedBooking.inquiry.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
                >
                  收款情况
                </h3>
                <div
                  className="space-y-3 rounded-xl border p-4"
                  style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#8b8ba3' }}>
                      订单总价
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
                    >
                      ¥{selectedBooking.quotation.totalPrice}
                    </span>
                  </div>
                  <div
                    className="h-px w-full"
                    style={{ backgroundColor: '#2a2a40' }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#8b8ba3' }}>
                        已收订金
                      </span>
                      {selectedBooking.quotation.depositMethod && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{ backgroundColor: '#2a2a40', color: '#8b8ba3' }}
                        >
                          {PAYMENT_METHOD_LABELS[selectedBooking.quotation.depositMethod]}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-medium flex items-center gap-1"
                      style={{ color: '#33b89a' }}
                    >
                      <CheckCircle size={12} />
                      ¥{selectedBooking.quotation.depositAmount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#8b8ba3' }}>
                      尾款金额
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: !selectedBooking.quotation.finalPaid ? '#c84b31' : '#33b89a',
                      }}
                    >
                      ¥{selectedBooking.quotation.totalPrice - (selectedBooking.quotation.depositAmount || 0)}
                      {!selectedBooking.quotation.finalPaid && ' (待收)'}
                    </span>
                  </div>
                  <div
                    className="h-px w-full"
                    style={{ backgroundColor: '#2a2a40' }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#8b8ba3' }}>
                      尾款状态
                    </span>
                    {selectedBooking.quotation.finalPaid ? (
                      <span
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: '#33b89a22', color: '#33b89a' }}
                      >
                        <CheckCircle size={12} />
                        已收
                        {selectedBooking.quotation.finalPaymentMethod && (
                          <span
                            className="ml-1 rounded px-1 py-0.5 text-[10px]"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#33b89a' }}
                          >
                            {PAYMENT_METHOD_LABELS[selectedBooking.quotation.finalPaymentMethod]}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: '#c84b3122', color: '#c84b31' }}
                      >
                        <AlertCircle size={12} />
                        未收
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
                >
                  剧本内容
                </h3>
                <div className="space-y-2">
                  {selectedBooking.quotation.selectedScripts.map((script) => (
                    <div
                      key={script.id}
                      className="rounded-xl border p-3"
                      style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold" style={{ color: '#e2e2f0' }}>
                          {script.name}
                        </h4>
                        <span
                          className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px]"
                          style={{ backgroundColor: '#2a2a40', color: '#a0a0b8' }}
                        >
                          {SCRIPT_TYPE_LABELS[script.type]}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-x-4 gap-y-1 text-xs flex-wrap">
                        <span style={{ color: '#8b8ba3' }}>
                          难度:
                          <span className="ml-1" style={{ color: '#e2e2f0' }}>
                            {DIFFICULTY_LABELS[script.difficulty]}
                          </span>
                        </span>
                        <span style={{ color: '#8b8ba3' }}>
                          <Clock size={10} className="mb-0.5 inline mr-1" />
                          {script.duration} 小时
                        </span>
                        <span style={{ color: '#8b8ba3' }}>
                          <DollarSign size={10} className="mb-0.5 inline mr-1" />
                          ¥{script.pricePerPerson}/人
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBooking.checklist && (
                <div className="space-y-3">
                  <h3
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
                  >
                    执行清单
                  </h3>
                  <div
                    className="space-y-3 rounded-xl border p-4"
                    style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
                  >
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span style={{ color: '#6a6a80' }}>整体进度</span>
                        <span style={{ color: '#8b8ba3' }}>
                          {selectedBooking.checklist.tasks.filter((t) => t.status === 'done').length}/
                          {selectedBooking.checklist.tasks.length} 项
                        </span>
                      </div>
                      <div
                        className="h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: '#2a2a40' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${
                              (selectedBooking.checklist.tasks.filter((t) => t.status === 'done').length /
                                selectedBooking.checklist.tasks.length) *
                              100
                            }%`,
                            backgroundColor:
                              selectedBooking.checklist.tasks.filter((t) => t.status === 'done').length ===
                              selectedBooking.checklist.tasks.length
                                ? '#33b89a'
                                : '#e2a04a',
                          }}
                        />
                      </div>
                    </div>
                    {(() => {
                      const nextTask = getNextPendingTask(selectedBooking.checklist)
                      if (!nextTask) return null
                      return (
                        <div
                          className="rounded-lg border-l-4 p-3"
                          style={{
                            backgroundColor: 'rgba(226, 160, 74, 0.08)',
                            borderLeftColor: '#e2a04a',
                          }}
                        >
                          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: '#e2a04a' }}>
                            下一个待办
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#e2a04a' }} />
                            <div>
                              <div
                                className="text-xs font-medium"
                                style={{ color: '#e2a04a' }}
                              >
                                {nextTask.time}
                              </div>
                              <div className="text-sm font-bold mt-0.5" style={{ color: '#e2e2f0' }}>
                                {nextTask.task}
                              </div>
                              <div className="text-[11px] mt-1" style={{ color: '#6a6a80' }}>
                                负责人: {nextTask.assignee}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    <button
                      onClick={() => goToChecklist(selectedBooking)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#e2a04a22', color: '#e2a04a' }}
                    >
                      <Clapperboard size={14} />
                      打开执行清单
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="sticky bottom-0 flex gap-3 border-t p-4"
              style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
            >
              <button
                onClick={() => goToQuotation(selectedBooking)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: '#2a2a40', color: '#e2e2f0' }}
              >
                <FileText size={14} />
                编辑报价
              </button>
              <button
                onClick={() => goToChecklist(selectedBooking)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
              >
                <Clapperboard size={14} />
                打开执行清单
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
