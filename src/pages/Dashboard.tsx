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
  ChevronDown,
  Phone,
  DoorOpen,
  X,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Pencil,
  UserPlus,
  BarChart3,
  ArrowRightLeft,
  Copy,
  Check,
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
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/types'
import type { OrderStatus, InquiryData, QuotationData, ChecklistData, PaymentMethod, TaskRole, Employee, ChecklistTask } from '@/types'
import { computeOrderStatus, getNextPendingTask } from '@/utils/checklist'
import { MOCK_EMPLOYEES, getDefaultScheduleForDate } from '@/data/employees'

interface BookingBase {
  inquiry: InquiryData
  quotation: QuotationData
  checklist?: ChecklistData
}

interface BookingWithStatus extends BookingBase {
  status: OrderStatus
}

type PaymentGroupKey = 'deposit_received' | 'final_pending' | 'final_paid'
type ViewMode = 'schedule' | 'payment' | 'staff'
type StaffRoleKey = 'front_desk' | 'dm' | 'logistics'

const TAB_FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'not_started',
  'in_progress',
  'wrapping_up',
  'completed',
]

const PAYMENT_GROUPS: { key: PaymentGroupKey; label: string; color: string }[] = [
  { key: 'deposit_received', label: '订金已收', color: '#33b89a' },
  { key: 'final_pending', label: '尾款待收', color: '#c84b31' },
  { key: 'final_paid', label: '已结清', color: '#33b89a' },
]

const STAFF_ROLES: { key: StaffRoleKey; label: string; color: string }[] = [
  { key: 'front_desk', label: '前台', color: '#3b82f6' },
  { key: 'dm', label: 'DM', color: '#e2a04a' },
  { key: 'logistics', label: '后勤', color: '#33b89a' },
]

const SHIFT_LABELS: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
  all: '全天',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const getTodayConfirmed = useAppStore((s) => s.getTodayConfirmed)
  const getTasksForDate = useAppStore((s) => s.getTasksForDate)
  const transferTasksFromTo = useAppStore((s) => s.transferTasksFromTo)
  const setCurrentInquiryId = useAppStore((s) => s.setCurrentInquiryId)
  const setCurrentQuotationId = useAppStore((s) => s.setCurrentQuotationId)
  const setCurrentChecklistId = useAppStore((s) => s.setCurrentChecklistId)
  const markFinalPaid = useAppStore((s) => s.markFinalPaid)
  const updateQuotation = useAppStore((s) => s.updateQuotation)

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('schedule')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithStatus | null>(null)

  const [expandedPaymentGroups, setExpandedPaymentGroups] = useState<Record<PaymentGroupKey, boolean>>({
    deposit_received: true,
    final_pending: true,
    final_paid: true,
  })

  const [expandedStaffGroups, setExpandedStaffGroups] = useState<Record<StaffRoleKey, boolean>>({
    front_desk: true,
    dm: true,
    logistics: true,
  })

  const [finalPaymentMethod, setFinalPaymentMethod] = useState<PaymentMethod>('wechat')
  const [showFinalPaymentConfirm, setShowFinalPaymentConfirm] = useState(false)

  const [isEditingDeposit, setIsEditingDeposit] = useState(false)
  const [editDepositAmount, setEditDepositAmount] = useState<number>(0)
  const [editDepositMethod, setEditDepositMethod] = useState<PaymentMethod | ''>('')

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewCopied, setReviewCopied] = useState(false)
  const [reviewText, setReviewText] = useState('')

  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferFromEmp, setTransferFromEmp] = useState<Employee | null>(null)
  const [transferToName, setTransferToName] = useState('')
  const [transferToRole, setTransferToRole] = useState<TaskRole>('logistics')

  const [refreshKey, setRefreshKey] = useState(0)

  const todayBookings: BookingBase[] = useMemo(
    () => getTodayConfirmed(selectedDate) as BookingBase[],
    [getTodayConfirmed, selectedDate, refreshKey]
  )

  const bookingsWithStatus: BookingWithStatus[] = useMemo(
    () =>
      todayBookings.map((b) => ({
        ...b,
        status: computeOrderStatus(b.checklist, b.quotation),
      })),
    [todayBookings]
  )

  const todayTasks = useMemo(
    () => getTasksForDate(selectedDate),
    [getTasksForDate, selectedDate, refreshKey]
  )

  const schedule = useMemo(
    () => getDefaultScheduleForDate(selectedDate),
    [selectedDate]
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

  const paymentStats = useMemo(() => {
    let depositCount = 0
    let depositTotal = 0
    let finalPendingCount = 0
    let finalPendingTotal = 0
    let settledCount = 0
    let totalRevenue = 0

    bookingsWithStatus.forEach((b) => {
      const deposit = b.quotation.depositAmount || 0
      const total = b.quotation.totalPrice || 0
      totalRevenue += total

      if (deposit > 0) {
        depositCount++
        depositTotal += deposit
      }

      if (b.quotation.finalPaid) {
        settledCount++
      } else if (b.quotation.confirmed && deposit > 0) {
        finalPendingCount++
        finalPendingTotal += total - deposit
      }
    })

    return {
      depositCount,
      depositTotal,
      finalPendingCount,
      finalPendingTotal,
      settledCount,
      totalRevenue,
    }
  }, [bookingsWithStatus])

  const staffData = useMemo(() => {
    const result: Record<StaffRoleKey, {
      employee: Employee
      shift: string
      tasks: { task: ChecklistTask; booking: BookingWithStatus }[]
    }[]> = {
      front_desk: [],
      dm: [],
      logistics: [],
    }

    schedule.forEach((entry) => {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === entry.employeeId)
      if (!emp) return

      const empTasks = todayTasks
        .filter((t) => t.task.assignee === emp.name)
        .map((t) => {
          const booking = bookingsWithStatus.find((b) => b.inquiry.id === t.inquiryId)
          return { task: t.task, booking: booking! }
        })
        .filter((x) => x.booking)

      result[emp.role].push({
        employee: emp,
        shift: entry.shift,
        tasks: empTasks,
      })
    })

    return result
  }, [schedule, todayTasks, bookingsWithStatus])

  const filteredBookings = useMemo(() => {
    const filtered =
      activeTab === 'all'
        ? bookingsWithStatus
        : bookingsWithStatus.filter((b) => b.status === activeTab)
    return [...filtered].sort((a, b) =>
      a.quotation.timeSlot.localeCompare(b.quotation.timeSlot)
    )
  }, [bookingsWithStatus, activeTab])

  const paymentGroupedBookings = useMemo(() => {
    const groups: Record<PaymentGroupKey, BookingWithStatus[]> = {
      deposit_received: [],
      final_pending: [],
      final_paid: [],
    }

    bookingsWithStatus.forEach((b) => {
      const deposit = b.quotation.depositAmount || 0
      if (b.quotation.finalPaid) {
        groups.final_paid.push(b)
      } else if (deposit > 0) {
        groups.final_pending.push(b)
      } else {
        groups.deposit_received.push(b)
      }
    })

    Object.keys(groups).forEach((key) => {
      groups[key as PaymentGroupKey].sort((a, b) =>
        a.quotation.timeSlot.localeCompare(b.quotation.timeSlot)
      )
    })

    return groups
  }, [bookingsWithStatus])

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

  const togglePaymentGroup = (key: PaymentGroupKey) => {
    setExpandedPaymentGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleStaffGroup = (key: StaffRoleKey) => {
    setExpandedStaffGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleMarkFinalPaid = () => {
    if (!selectedBooking) return
    markFinalPaid(selectedBooking.quotation.id, finalPaymentMethod)
    setShowFinalPaymentConfirm(false)
    setSelectedBooking((prev) =>
      prev ? { ...prev, quotation: { ...prev.quotation, finalPaid: true, finalPaymentMethod } } : null
    )
    setRefreshKey((k) => k + 1)
  }

  const startEditDeposit = () => {
    if (!selectedBooking) return
    setEditDepositAmount(selectedBooking.quotation.depositAmount || 0)
    setEditDepositMethod(selectedBooking.quotation.depositMethod || '')
    setIsEditingDeposit(true)
  }

  const saveEditDeposit = () => {
    if (!selectedBooking) return
    updateQuotation(selectedBooking.quotation.id, {
      depositAmount: editDepositAmount,
      depositMethod: editDepositMethod,
    })
    setIsEditingDeposit(false)
    setRefreshKey((k) => k + 1)
    setSelectedBooking((prev) =>
      prev ? { ...prev, quotation: { ...prev.quotation, depositAmount: editDepositAmount, depositMethod: editDepositMethod } } : null
    )
  }

  const generateReviewText = () => {
    const date = formatDate(selectedDate)
    const totalOrders = bookingsWithStatus.length
    const totalRevenue = paymentStats.totalRevenue
    const depositTotal = paymentStats.depositTotal
    const finalPending = paymentStats.finalPendingTotal
    const settled = paymentStats.settledCount
    const completed = tabCounts.completed
    const inProgress = tabCounts.in_progress + tabCounts.wrapping_up
    const notStarted = tabCounts.not_started

    const notes: string[] = []
    bookingsWithStatus.forEach((b) => {
      if (b.inquiry.notes) {
        notes.push(`${b.inquiry.customerName}: ${b.inquiry.notes}`)
      }
    })

    const text = `【${date} 晚间复盘】

📊 今日数据
• 总订单: ${totalOrders} 单
• 总营收: ¥${totalRevenue}
• 已收订金: ¥${depositTotal}
• 未收尾款: ¥${finalPending}
• 已结清: ${settled} 单

✅ 完成情况
• 已完成: ${completed} 单
• 进行中: ${inProgress} 单
• 未开始: ${notStarted} 单

${notes.length > 0 ? `📝 客户需求
${notes.map((n) => `• ${n}`).join('\n')}

` : ''}💰 收款情况
• 订金已收: ${paymentStats.depositCount} 单
• 尾款待收: ${paymentStats.finalPendingCount} 单
• 已结清: ${settled} 单`

    setReviewText(text)
  }

  const copyReview = async () => {
    try {
      await navigator.clipboard.writeText(reviewText)
      setReviewCopied(true)
      setTimeout(() => setReviewCopied(false), 2000)
    } catch (e) {
      const ta = document.createElement('textarea')
      ta.value = reviewText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setReviewCopied(true)
      setTimeout(() => setReviewCopied(false), 2000)
    }
  }

  const openTransferModal = (emp: Employee) => {
    setTransferFromEmp(emp)
    setTransferToName('')
    setTransferToRole(emp.role)
    setShowTransferModal(true)
  }

  const confirmTransfer = () => {
    if (!transferFromEmp || !transferToName.trim()) return
    const count = transferTasksFromTo(
      transferFromEmp.name,
      transferToName.trim(),
      transferToRole,
      selectedDate
    )
    alert(`已成功将 ${transferFromEmp.name} 的 ${count} 条任务转交给 ${transferToName}`)
    setShowTransferModal(false)
    setTransferFromEmp(null)
    setRefreshKey((k) => k + 1)
  }

  const renderOrderCard = (booking: BookingWithStatus) => {
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
              {booking.quotation.finalPaid && (
                <span
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: '#33b89a22', color: '#33b89a' }}
                >
                  <CheckCircle size={10} />
                  已结清
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
  }

  const renderChecklistSection = (checklist: ChecklistData) => {
    const doneCount = checklist.tasks.filter((t) => t.status === 'done').length
    const totalCount = checklist.tasks.length
    const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

    return (
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
                {doneCount}/{totalCount} 项
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: '#2a2a40' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor:
                    totalCount > 0 && doneCount === totalCount ? '#33b89a' : '#e2a04a',
                }}
              />
            </div>
          </div>
          {(() => {
            if (totalCount === 0) {
              return (
                <div
                  className="rounded-lg border-l-4 p-3"
                  style={{
                    backgroundColor: 'rgba(139, 139, 163, 0.08)',
                    borderLeftColor: '#8b8ba3',
                  }}
                >
                  <div
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: '#8b8ba3' }}
                  >
                    暂无任务
                  </div>
                </div>
              )
            }
            const nextTask = getNextPendingTask(checklist)
            if (!nextTask) return null
            return (
              <div
                className="rounded-lg border-l-4 p-3"
                style={{
                  backgroundColor: 'rgba(226, 160, 74, 0.08)',
                  borderLeftColor: '#e2a04a',
                }}
              >
                <div
                  className="mb-1 text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: '#e2a04a' }}
                >
                  下一个待办
                </div>
                <div className="flex items-start gap-2">
                  <Clock
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: '#e2a04a' }}
                  />
                  <div>
                    <div
                      className="text-xs font-medium"
                      style={{ color: '#e2a04a' }}
                    >
                      {nextTask.time}
                    </div>
                    <div
                      className="text-sm font-bold mt-0.5"
                      style={{ color: '#e2e2f0' }}
                    >
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
            onClick={() => goToChecklist(selectedBooking!)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: '#e2a04a22', color: '#e2a04a' }}
          >
            <Clapperboard size={14} />
            打开执行清单
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  const renderStaffCard = (role: StaffRoleKey) => {
    const group = STAFF_ROLES.find((g) => g.key === role)!
    const staffList = staffData[role]
    const isExpanded = expandedStaffGroups[role]

    return (
      <div
        key={role}
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
      >
        <button
          onClick={() => toggleStaffGroup(role)}
          className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <ChevronDown
              size={16}
              style={{
                color: group.color,
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }}
            />
            <span
              className="text-sm font-semibold"
              style={{
                fontFamily: "'ZCOOL QingKe HuangYou', cursive",
                color: group.color,
              }}
            >
              {group.label}
            </span>
            <span
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium"
              style={{
                backgroundColor: `${group.color}22`,
                color: group.color,
              }}
            >
              {staffList.length} 人
            </span>
          </div>
        </button>
        {isExpanded && (
          <div className="space-y-3 px-4 pb-4">
            {staffList.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: '#6a6a80' }}>
                今天该岗位没有人排班
              </div>
            ) : (
              staffList.map(({ employee, shift, tasks }) => (
                <div
                  key={employee.id}
                  className="rounded-lg border p-3"
                  style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${group.color}22` }}
                      >
                        <UserPlus size={16} style={{ color: group.color }} />
                      </div>
                      <div>
                        <div
                          className="text-sm font-semibold"
                          style={{ color: '#e2e2f0' }}
                        >
                          {employee.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] mt-0.5">
                          <span
                            className="rounded px-1.5 py-0.5"
                            style={{ backgroundColor: `${group.color}22`, color: group.color }}
                          >
                            {SHIFT_LABELS[shift]}
                          </span>
                          <span style={{ color: '#6a6a80' }}>
                            {tasks.length} 项任务
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openTransferModal(employee)}
                      className="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-colors hover:bg-white/5"
                      style={{ borderColor: '#2a2a40', color: '#e2a04a' }}
                    >
                      <ArrowRightLeft size={10} />
                      转派
                    </button>
                  </div>

                  {tasks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {tasks.map(({ task, booking }) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 rounded px-2 py-1.5 text-[11px]"
                          style={{ backgroundColor: '#0f0f1a' }}
                        >
                          <span
                            className="flex-shrink-0 font-mono text-xs"
                            style={{ color: '#e2a04a' }}
                          >
                            {task.time}
                          </span>
                          <span
                            className="flex-1 truncate"
                            style={{ color: '#c0c0d4' }}
                          >
                            {task.task}
                          </span>
                          <span
                            className="flex-shrink-0 text-[10px] rounded px-1 py-0.5"
                            style={{
                              backgroundColor: task.status === 'done' ? '#33b89a22' : '#e2a04a22',
                              color: task.status === 'done' ? '#33b89a' : '#e2a04a',
                            }}
                          >
                            {booking.inquiry.customerName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
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
              查看当天所有生日包场订单、执行进度及收款情况
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                generateReviewText()
                setShowReviewModal(true)
              }}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: '#2a2a40', color: '#e2a04a' }}
            >
              <BarChart3 size={14} />
              晚间复盘
            </button>
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

        <div className="mb-6 grid grid-cols-4 gap-4">
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              订金已收
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#33b89a' }}
            >
              {paymentStats.depositCount} 单
            </div>
            <div className="mt-1 text-xs" style={{ color: '#8b8ba3' }}>
              合计 ¥{paymentStats.depositTotal}
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              尾款待收
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#c84b31' }}
            >
              {paymentStats.finalPendingCount} 单
            </div>
            <div className="mt-1 text-xs" style={{ color: '#8b8ba3' }}>
              待收 ¥{paymentStats.finalPendingTotal}
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              已结清
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#33b89a' }}
            >
              {paymentStats.settledCount} 单
            </div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="text-xs" style={{ color: '#8b8ba3' }}>
              当日总营收
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
            >
              ¥{paymentStats.totalRevenue}
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
              {formatDate(selectedDate)}{' '}
              {viewMode === 'schedule' ? '排期' : viewMode === 'payment' ? '收款' : '排班'}
            </h2>
            <div className="text-xs" style={{ color: '#6a6a80' }}>
              {viewMode === 'schedule' ? '按时段排序' : viewMode === 'payment' ? '按收款状态分组' : '按岗位分组'}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {viewMode === 'schedule' && TAB_FILTERS.map((tab) => {
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

            <div className="flex rounded-lg border p-0.5" style={{ borderColor: '#2a2a40' }}>
              <button
                onClick={() => setViewMode('schedule')}
                className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'schedule' ? '#e2a04a' : 'transparent',
                  color: viewMode === 'schedule' ? '#0f0f1a' : '#8b8ba3',
                }}
              >
                <Calendar size={12} />
                排期视图
              </button>
              <button
                onClick={() => setViewMode('payment')}
                className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'payment' ? '#e2a04a' : 'transparent',
                  color: viewMode === 'payment' ? '#0f0f1a' : '#8b8ba3',
                }}
              >
                <DollarSign size={12} />
                收款视图
              </button>
              <button
                onClick={() => setViewMode('staff')}
                className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === 'staff' ? '#e2a04a' : 'transparent',
                  color: viewMode === 'staff' ? '#0f0f1a' : '#8b8ba3',
                }}
              >
                <Users size={12} />
                排班视图
              </button>
            </div>
          </div>

          {viewMode === 'schedule' && filteredBookings.length === 0 ? (
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
          ) : viewMode === 'schedule' ? (
            <div className="space-y-3">
              {filteredBookings.map((booking) => renderOrderCard(booking))}
            </div>
          ) : viewMode === 'payment' ? (
            <div className="space-y-4">
              {PAYMENT_GROUPS.map((group) => {
                const bookings = paymentGroupedBookings[group.key]
                const isExpanded = expandedPaymentGroups[group.key]
                return (
                  <div
                    key={group.key}
                    className="rounded-xl border overflow-hidden"
                    style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
                  >
                    <button
                      onClick={() => togglePaymentGroup(group.key)}
                      className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          size={16}
                          style={{
                            color: group.color,
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s',
                          }}
                        />
                        <span
                          className="text-sm font-semibold"
                          style={{
                            fontFamily: "'ZCOOL QingKe HuangYou', cursive",
                            color: group.color,
                          }}
                        >
                          {group.label}
                        </span>
                        <span
                          className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${group.color}22`,
                            color: group.color,
                          }}
                        >
                          {bookings.length}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="space-y-3 px-4 pb-4">
                        {bookings.length === 0 ? (
                          <div className="py-6 text-center text-xs" style={{ color: '#6a6a80' }}>
                            暂无订单
                          </div>
                        ) : (
                          bookings.map((booking) => renderOrderCard(booking))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {STAFF_ROLES.map((r) => renderStaffCard(r.key))}
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
                  {isEditingDeposit ? (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 text-xs" style={{ color: '#6a6a80' }}>
                          订金金额
                        </div>
                        <input
                          type="number"
                          value={editDepositAmount}
                          onChange={(e) => setEditDepositAmount(Number(e.target.value))}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                          style={{
                            backgroundColor: '#16162a',
                            borderColor: '#2a2a40',
                            color: '#e2e2f0',
                          }}
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-xs" style={{ color: '#6a6a80' }}>
                          支付方式
                        </div>
                        <select
                          value={editDepositMethod}
                          onChange={(e) => setEditDepositMethod(e.target.value as PaymentMethod | '')}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                          style={{
                            backgroundColor: '#16162a',
                            borderColor: '#2a2a40',
                            color: '#e2e2f0',
                          }}
                        >
                          <option value="">未选择</option>
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                            <option key={m} value={m}>
                              {PAYMENT_METHOD_LABELS[m]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditDeposit}
                          className="flex-1 rounded-lg py-2 text-sm font-medium"
                          style={{ backgroundColor: '#33b89a', color: '#0f0f1a' }}
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setIsEditingDeposit(false)}
                          className="flex-1 rounded-lg border py-2 text-sm font-medium"
                          style={{ borderColor: '#2a2a40', color: '#8b8ba3' }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
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
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium flex items-center gap-1"
                          style={{ color: '#33b89a' }}
                        >
                          <CheckCircle size={12} />
                          ¥{selectedBooking.quotation.depositAmount || 0}
                        </span>
                        <button
                          onClick={startEditDeposit}
                          className="rounded p-1 transition-colors hover:bg-white/10"
                          style={{ color: '#8b8ba3' }}
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    </div>
                  )}
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
                  {!selectedBooking.quotation.finalPaid && (
                    <div
                      className="mt-2 rounded-lg border p-3"
                      style={{
                        backgroundColor: 'rgba(200, 75, 49, 0.06)',
                        borderColor: 'rgba(200, 75, 49, 0.2)',
                      }}
                    >
                      {!showFinalPaymentConfirm ? (
                        <button
                          onClick={() => setShowFinalPaymentConfirm(true)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors"
                          style={{ backgroundColor: '#33b89a', color: '#0f0f1a' }}
                        >
                          <CheckCircle size={14} />
                          标记尾款已收
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <div className="mb-1 text-xs" style={{ color: '#6a6a80' }}>
                              选择支付方式
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setFinalPaymentMethod(m)}
                                  className="rounded-lg border px-2 py-1.5 text-xs transition-all"
                                  style={{
                                    backgroundColor: finalPaymentMethod === m ? '#33b89a22' : 'transparent',
                                    borderColor: finalPaymentMethod === m ? '#33b89a' : '#2a2a40',
                                    color: finalPaymentMethod === m ? '#33b89a' : '#8b8ba3',
                                  }}
                                >
                                  {PAYMENT_METHOD_LABELS[m]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleMarkFinalPaid}
                              className="flex-1 rounded-lg py-2 text-sm font-semibold"
                              style={{ backgroundColor: '#33b89a', color: '#0f0f1a' }}
                            >
                              确认收款
                            </button>
                            <button
                              onClick={() => setShowFinalPaymentConfirm(false)}
                              className="flex-1 rounded-lg border py-2 text-sm font-medium"
                              style={{ borderColor: '#2a2a40', color: '#8b8ba3' }}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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

              {selectedBooking.checklist && renderChecklistSection(selectedBooking.checklist)}
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

      {showReviewModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setShowReviewModal(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
              >
                <BarChart3 className="mb-1 mr-2 inline-block" size={20} />
                晚间复盘
              </h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#8b8ba3' }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="whitespace-pre-wrap rounded-xl border p-4 text-sm leading-relaxed"
              style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40', color: '#c0c0d4' }}
            >
              {reviewText}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={copyReview}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
              >
                {reviewCopied ? <Check size={14} /> : <Copy size={14} />}
                {reviewCopied ? '已复制' : '复制到剪贴板'}
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: '#2a2a40', color: '#e2e2f0' }}
              >
                关闭
              </button>
            </div>
          </div>
        </>
      )}

      {showTransferModal && transferFromEmp && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setShowTransferModal(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
              >
                <ArrowRightLeft className="mb-1 mr-2 inline-block" size={20} />
                批量转派任务
              </h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#8b8ba3' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div
                className="rounded-xl border p-3"
                style={{ backgroundColor: '#0f0f1a', borderColor: '#2a2a40' }}
              >
                <div className="text-xs mb-1" style={{ color: '#6a6a80' }}>
                  转出人员
                </div>
                <div className="text-sm font-semibold" style={{ color: '#e2e2f0' }}>
                  {transferFromEmp.name}
                  <span
                    className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                    style={{ backgroundColor: ROLE_COLORS[transferFromEmp.role] + '22', color: ROLE_COLORS[transferFromEmp.role] }}
                  >
                    {ROLE_LABELS[transferFromEmp.role]}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#6a6a80' }}>
                  接收人姓名
                </div>
                <input
                  type="text"
                  value={transferToName}
                  onChange={(e) => setTransferToName(e.target.value)}
                  placeholder="请输入接收人姓名"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: '#16162a',
                    borderColor: '#2a2a40',
                    color: '#e2e2f0',
                  }}
                />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#6a6a80' }}>
                  接收人角色
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(ROLE_LABELS) as TaskRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTransferToRole(r)}
                      className="rounded-lg border px-2 py-1.5 text-xs transition-all"
                      style={{
                        backgroundColor: transferToRole === r ? ROLE_COLORS[r] + '22' : 'transparent',
                        borderColor: transferToRole === r ? ROLE_COLORS[r] : '#2a2a40',
                        color: transferToRole === r ? ROLE_COLORS[r] : '#8b8ba3',
                      }}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={confirmTransfer}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
              >
                确认转派
              </button>
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: '#2a2a40', color: '#e2e2f0' }}
              >
                取消
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
