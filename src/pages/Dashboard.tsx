import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, Clock, FileText, Clapperboard, PartyPopper, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS } from '@/types'

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

  const todayBookings = useMemo(
    () => getTodayConfirmed(selectedDate),
    [getTodayConfirmed, selectedDate]
  )

  const sortedBookings = useMemo(() => {
    return [...todayBookings].sort((a, b) =>
      a.quotation.timeSlot.localeCompare(b.quotation.timeSlot)
    )
  }, [todayBookings])

  const totalGuests = useMemo(
    () => sortedBookings.reduce((sum, b) => sum + b.inquiry.guestCount, 0),
    [sortedBookings]
  )

  const completedTasks = useMemo(
    () =>
      sortedBookings.reduce((sum, b) => {
        if (!b.checklist) return sum
        return sum + b.checklist.tasks.filter((t) => t.status === 'done').length
      }, 0),
    [sortedBookings]
  )

  const totalTasks = useMemo(
    () =>
      sortedBookings.reduce((sum, b) => {
        if (!b.checklist) return sum
        return sum + b.checklist.tasks.length
      }, 0),
    [sortedBookings]
  )

  const goToQuotation = (booking: (typeof sortedBookings)[0]) => {
    setCurrentInquiryId(booking.inquiry.id)
    setCurrentQuotationId(booking.quotation.id)
    navigate('/quotation')
  }

  const goToChecklist = (booking: (typeof sortedBookings)[0]) => {
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
              {sortedBookings.length} 单
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
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: totalTasks > 0 && completedTasks === totalTasks ? '#33b89a' : '#e2a04a' }}
            >
              {completedTasks}/{totalTasks} 项
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
        >
          <div
            className="mb-4 flex items-center justify-between"
          >
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

          {sortedBookings.length === 0 ? (
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
              {sortedBookings.map((booking) => {
                const doneCount = booking.checklist
                  ? booking.checklist.tasks.filter((t) => t.status === 'done').length
                  : 0
                const totalCount = booking.checklist
                  ? booking.checklist.tasks.length
                  : 0
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

                return (
                  <div
                    key={booking.quotation.id}
                    className="rounded-xl border p-4 transition-all hover:border-amber-500/40"
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
                          style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
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
                          onClick={() => goToQuotation(booking)}
                          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
                          style={{ borderColor: '#2a2a40', color: '#8b8ba3' }}
                        >
                          <FileText size={12} />
                          报价
                        </button>
                        <button
                          onClick={() => goToChecklist(booking)}
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
    </div>
  )
}
