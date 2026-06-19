import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  Loader,
  Printer,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  X,
  DollarSign,
  CreditCard,
  CheckCircle,
  Users,
  Copy,
  Receipt,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { PAYMENT_METHOD_LABELS, ROLE_LABELS, ROLE_COLORS, SCRIPT_TYPE_LABELS } from '@/types'
import type { PaymentMethod, TaskStatus, TaskRole, ChecklistTask } from '@/types'
import { generateChecklistTasks, parseTimeToMinutes } from '@/utils/checklist'
import { getCategoryLabel } from '@/utils/quotation'

const STATUS_CYCLE: TaskStatus[] = ['pending', 'in_progress', 'done']

const STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  pending: Circle,
  in_progress: Loader,
  done: CheckCircle2,
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-[#e2a04a]',
  done: 'text-[#33b89a]',
}

const STATUS_CIRCLE_RING: Record<TaskStatus, string> = {
  pending: 'border-gray-600',
  in_progress: 'border-[#e2a04a]',
  done: 'border-[#33b89a]',
}

const ROLE_OPTIONS: { value: TaskRole; label: string }[] = [
  { value: 'front_desk', label: '前台' },
  { value: 'dm', label: 'DM' },
  { value: 'logistics', label: '后勤' },
]

const FILTER_OPTIONS: { value: 'all' | TaskRole; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'front_desk', label: ROLE_LABELS.front_desk },
  { value: 'dm', label: ROLE_LABELS.dm },
  { value: 'logistics', label: ROLE_LABELS.logistics },
]

const BULK_FROM_OPTIONS: { value: 'all' | TaskRole; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'front_desk', label: ROLE_LABELS.front_desk },
  { value: 'dm', label: ROLE_LABELS.dm },
  { value: 'logistics', label: ROLE_LABELS.logistics },
]

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: '现金' },
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'card', label: '刷卡' },
  { value: 'bank', label: '银行转账' },
]

interface EditFormState {
  time: string
  task: string
  assignee: string
  role: TaskRole
}

export default function Checklist() {
  const navigate = useNavigate()
  const currentQuotationId = useAppStore((s) => s.currentQuotationId)
  const quotations = useAppStore((s) => s.quotations)
  const inquiries = useAppStore((s) => s.inquiries)
  const checklists = useAppStore((s) => s.checklists)
  const addChecklist = useAppStore((s) => s.addChecklist)
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus)
  const updateTask = useAppStore((s) => s.updateTask)
  const addTask = useAppStore((s) => s.addTask)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const setCurrentQuotationId = useAppStore((s) => s.setCurrentQuotationId)
  const markFinalPaid = useAppStore((s) => s.markFinalPaid)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    time: '',
    task: '',
    assignee: '',
    role: 'front_desk',
  })
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTaskForm, setNewTaskForm] = useState<EditFormState>({
    time: '00:00',
    task: '',
    assignee: '',
    role: 'front_desk',
  })
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<PaymentMethod>('cash')
  const [showFinalPaymentForm, setShowFinalPaymentForm] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'all' | TaskRole>('all')
  const [showBulkTransfer, setShowBulkTransfer] = useState(false)
  const [bulkFromRole, setBulkFromRole] = useState<'all' | TaskRole>('all')
  const [bulkToAssignee, setBulkToAssignee] = useState('')
  const [bulkToRole, setBulkToRole] = useState<TaskRole>('front_desk')
  const [showConfirmationSlip, setShowConfirmationSlip] = useState(false)
  const [copied, setCopied] = useState(false)

  const quotation = useMemo(
    () => quotations.find((q) => q.id === currentQuotationId),
    [quotations, currentQuotationId]
  )

  const inquiry = useMemo(
    () => inquiries.find((i) => i.id === quotation?.inquiryId),
    [inquiries, quotation]
  )

  const existingChecklist = useMemo(
    () => checklists.find((c) => c.quotationId === currentQuotationId),
    [checklists, currentQuotationId]
  )

  useEffect(() => {
    if (!quotation || !inquiry || existingChecklist) return
    if (!quotation.confirmed) return
    const tasks = generateChecklistTasks(inquiry, quotation.selectedScripts)
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    addChecklist({
      id,
      quotationId: quotation.id,
      inquiryId: inquiry.id,
      tasks,
      createdAt: new Date().toISOString(),
    })
  }, [quotation, inquiry, existingChecklist, addChecklist])

  const checklist = useMemo(
    () => checklists.find((c) => c.quotationId === currentQuotationId),
    [checklists, currentQuotationId]
  )

  const allTasks = checklist?.tasks ?? []

  const tasks = useMemo(() => {
    if (roleFilter === 'all') return allTasks
    return allTasks.filter((t) => t.role === roleFilter)
  }, [allTasks, roleFilter])

  const timeSlotChanged = useMemo(() => {
    if (!quotation || allTasks.length === 0) return false
    const firstTaskTime = allTasks[0].time
    const firstTaskMinutes = parseTimeToMinutes(firstTaskTime)
    const quotationMinutes = parseTimeToMinutes(quotation.timeSlot)
    const impliedBaseFromFirstTask = firstTaskMinutes + 60
    return Math.abs(impliedBaseFromFirstTask - quotationMinutes) > 1
  }, [quotation, allTasks])

  const handleCycleStatus = (taskId: string, current: TaskStatus) => {
    if (!checklist || editingTaskId === taskId) return
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    updateTaskStatus(checklist.id, taskId, next)
  }

  const handleStartEdit = (task: ChecklistTask) => {
    setEditingTaskId(task.id)
    setEditForm({
      time: task.time,
      task: task.task,
      assignee: task.assignee,
      role: task.role,
    })
    setIsAddingNew(false)
  }

  const handleSaveEdit = () => {
    if (!checklist || !editingTaskId) return
    updateTask(checklist.id, editingTaskId, {
      time: editForm.time,
      task: editForm.task,
      assignee: editForm.assignee,
      role: editForm.role,
    })
    setEditingTaskId(null)
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
  }

  const handleDeleteTask = (taskId: string) => {
    if (!checklist) return
    if (editingTaskId === taskId) {
      setEditingTaskId(null)
    }
    deleteTask(checklist.id, taskId)
  }

  const handleStartAdd = () => {
    setIsAddingNew(true)
    setEditingTaskId(null)
    setNewTaskForm({
      time: quotation?.timeSlot ?? '00:00',
      task: '',
      assignee: '',
      role: 'front_desk',
    })
  }

  const handleSaveNew = () => {
    if (!checklist || !newTaskForm.task.trim()) return
    addTask(checklist.id, {
      time: newTaskForm.time,
      task: newTaskForm.task,
      assignee: newTaskForm.assignee || '未指派',
      role: newTaskForm.role,
      status: 'pending',
    })
    setIsAddingNew(false)
  }

  const handleCancelAdd = () => {
    setIsAddingNew(false)
  }

  const handleRegenerate = () => {
    if (!quotation || !inquiry || !checklist) return
    const newTasks = generateChecklistTasks(inquiry, quotation.selectedScripts)
    const checklistId = checklist.id
    checklist.tasks.forEach((t) => deleteTask(checklistId, t.id))
    newTasks.forEach((t) => {
      addTask(checklistId, {
        time: t.time,
        task: t.task,
        assignee: t.assignee,
        role: t.role,
        status: t.status,
      })
    })
    setShowRegenerateConfirm(false)
  }

  const handleGoToQuotation = () => {
    if (currentQuotationId) {
      setCurrentQuotationId(currentQuotationId)
    }
    navigate('/quotation')
  }

  const handleMarkFinalPaid = () => {
    if (!currentQuotationId) return
    markFinalPaid(currentQuotationId, finalPaymentMethod)
    setShowFinalPaymentForm(false)
  }

  const handleBulkTransfer = () => {
    if (!checklist || !bulkToAssignee.trim()) return
    const targetTasks = bulkFromRole === 'all' ? allTasks : allTasks.filter((t) => t.role === bulkFromRole)
    targetTasks.forEach((task) => {
      updateTask(checklist.id, task.id, {
        assignee: bulkToAssignee.trim(),
        role: bulkToRole,
      })
    })
    setShowBulkTransfer(false)
    setBulkFromRole('all')
    setBulkToAssignee('')
    setBulkToRole('front_desk')
  }

  const categorySubtotals = useMemo(() => {
    const map: Record<string, number> = {}
    quotation?.items.forEach((item) => {
      const label = getCategoryLabel(item.category)
      map[label] = (map[label] || 0) + item.subtotal
    })
    return map
  }, [quotation])

  const confirmationText = useMemo(() => {
    if (!quotation || !inquiry) return ''
    const lines: string[] = []
    lines.push('生日包场确认单')
    lines.push('====================')
    lines.push(`日期：${inquiry.date}`)
    lines.push(`时间：${quotation.timeSlot}`)
    lines.push(`人数：${inquiry.guestCount}人`)
    lines.push(`客户姓名：${inquiry.customerName}`)
    lines.push('')
    lines.push('剧本清单：')
    quotation.selectedScripts.forEach((s) => {
      lines.push(`  · ${s.name}（${SCRIPT_TYPE_LABELS[s.type]}，${s.duration}小时）`)
    })
    lines.push('')
    lines.push('费用明细：')
    Object.entries(categorySubtotals).forEach(([label, amount]) => {
      lines.push(`  · ${label}：¥${amount.toFixed(2)}`)
    })
    if (quotation.discount > 0) {
      lines.push(`  · 优惠：-¥${quotation.discount.toFixed(2)}`)
    }
    lines.push(`  总计：¥${quotation.totalPrice.toFixed(2)}`)
    lines.push('')
    if (quotation.depositAmount > 0) {
      lines.push(`已收订金：¥${quotation.depositAmount.toFixed(2)}${quotation.depositMethod ? `（${PAYMENT_METHOD_LABELS[quotation.depositMethod]}）` : ''}`)
    }
    const remaining = Math.max(0, quotation.totalPrice - quotation.depositAmount)
    lines.push(`尾款：¥${remaining.toFixed(2)}`)
    lines.push('')
    lines.push('感谢您的预订，如有疑问请联系店长')
    return lines.join('\n')
  }, [quotation, inquiry, categorySubtotals])

  const handleCopyConfirmation = async () => {
    try {
      await navigator.clipboard.writeText(confirmationText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  const doneCount = allTasks.filter((t) => t.status === 'done').length
  const totalCount = allTasks.length
  const totalPrice = quotation?.totalPrice ?? 0
  const depositAmount = quotation?.depositAmount ?? 0
  const depositMethod = quotation?.depositMethod
  const remaining = Math.max(0, totalPrice - depositAmount)
  const finalPaid = quotation?.finalPaid ?? false
  const finalPaymentMethodPaid = quotation?.finalPaymentMethod

  if (!currentQuotationId || !quotation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="text-gray-400 text-lg" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          尚未确认报价单，请先前往询价页面
        </div>
        <button
          onClick={() => navigate('/inquiry')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#e2a04a', color: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}
        >
          <ArrowLeft size={16} />
          前往询价页
        </button>
      </div>
    )
  }

  if (!quotation.confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="text-gray-400 text-lg" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          报价单尚未确认，请先确认报价
        </div>
        <button
          onClick={() => navigate('/quotation')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#e2a04a', color: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}
        >
          <ArrowLeft size={16} />
          前往报价页
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}>
      <div className="print:hidden shrink-0 border-b border-white/10 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
      </div>

      <header className="shrink-0 px-6 pt-6 pb-4 border-b border-white/10 print:border-gray-300 print:border-b">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-white print:text-black"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive" }}
            >
              执行清单
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-400 print:text-gray-700">
              {inquiry && (
                <>
                  <span>客户：{inquiry.customerName}</span>
                  <span>日期：{inquiry.date}</span>
                  <span>人数：{inquiry.guestCount}人</span>
                </>
              )}
              <span>场次：{quotation.timeSlot}</span>
            </div>
            {timeSlotChanged && (
              <div className="mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-fit" style={{ backgroundColor: '#e2a04a22', color: '#e2a04a' }}>
                <span>提示：场次时间已调整，如需要可以重新生成清单</span>
                <button
                  onClick={() => setShowRegenerateConfirm(true)}
                  className="p-1 rounded hover:bg-[#e2a04a]/20 transition-colors"
                  title="重新生成清单"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
            <div className="mt-1 flex flex-wrap gap-2">
              {quotation.selectedScripts.map((s) => (
                <span
                  key={s.id}
                  className="inline-block text-xs px-2.5 py-0.5 rounded-full print:bg-gray-200 print:text-black"
                  style={{ backgroundColor: '#e2a04a22', color: '#e2a04a' }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {checklist && (
              <div className="text-right">
                <div className="text-sm text-gray-400 print:text-gray-600">
                  进度
                </div>
                <div className="text-xl font-bold" style={{ color: '#e2a04a' }}>
                  {doneCount}/{totalCount}
                </div>
              </div>
            )}
            <div className="print:hidden">
              <button
                onClick={() => setShowBulkTransfer(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                <Users size={14} />
                批量转派
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl print:border print:border-gray-300" style={{ backgroundColor: '#16162a' }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} style={{ color: '#e2a04a' }} />
            <span className="text-sm font-semibold text-white print:text-black" style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive" }}>
              收款状态
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-gray-500 print:text-gray-600 mb-0.5">订单总价</div>
              <div className="text-lg font-bold text-white print:text-black">¥{totalPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 print:text-gray-600 mb-0.5">
                订金已收 {depositMethod ? `· ${PAYMENT_METHOD_LABELS[depositMethod]}` : ''}
              </div>
              <div className="text-lg font-bold" style={{ color: '#33b89a' }}>¥{depositAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 print:text-gray-600 mb-0.5">尾款</div>
              <div className={`text-lg font-bold print:text-black`} style={{ color: finalPaid ? '#33b89a' : '#c84b31' }}>
                {finalPaid ? '已收' : `¥${remaining.toFixed(2)}`}
              </div>
            </div>
            <div>
              {finalPaid ? (
                <div className="flex items-center gap-1.5 h-full">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#33b89a22', color: '#33b89a' }}
                  >
                    <CheckCircle size={12} />
                    已收 {finalPaymentMethodPaid ? `· ${PAYMENT_METHOD_LABELS[finalPaymentMethodPaid]}` : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-end gap-2 print:hidden">
                  {!showFinalPaymentForm ? (
                    <button
                      onClick={() => setShowFinalPaymentForm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
                    >
                      <CreditCard size={14} />
                      标记尾款已收
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={finalPaymentMethod}
                        onChange={(e) => setFinalPaymentMethod(e.target.value as PaymentMethod)}
                        className="px-2 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                      >
                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleMarkFinalPaid}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                        style={{ backgroundColor: '#33b89a', color: '#fff' }}
                      >
                        <Check size={14} />
                        确认
                      </button>
                      <button
                        onClick={() => setShowFinalPaymentForm(false)}
                        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {finalPaid && (
                <div className="print:flex hidden items-center gap-1.5 h-full">
                  <span className="text-xs text-gray-600">收款方式：{finalPaymentMethodPaid ? PAYMENT_METHOD_LABELS[finalPaymentMethodPaid] : '-'}</span>
                </div>
              )}
              {!finalPaid && (
                <div className="print:flex hidden items-center h-full">
                  <span className="text-xs text-gray-600">尾款待收：¥{remaining.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="print:hidden mb-4 flex items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: roleFilter === opt.value ? '#e2a04a' : 'rgba(255,255,255,0.05)',
                color: roleFilter === opt.value ? '#0f0f1a' : '#9ca3af',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative ml-4">
          {tasks.length > 0 && (
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10 print:bg-gray-300" />
          )}

          <div className="flex flex-col gap-1">
            {tasks.map((task) => {
              const Icon = STATUS_ICON[task.status]
              const isEditing = editingTaskId === task.id

              if (isEditing) {
                return (
                  <div
                    key={task.id}
                    className="relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-lg bg-white/5"
                  >
                    <div
                      className={`relative z-10 mt-0.5 flex items-center justify-center w-[23px] h-[23px] rounded-full border-2 bg-[#0f0f1a] print:bg-white ${STATUS_CIRCLE_RING[task.status]}`}
                    >
                      <Icon
                        size={12}
                        className={`${STATUS_COLOR[task.status]} ${task.status === 'in_progress' ? 'animate-spin' : ''}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[100px] max-w-[140px]">
                          <label className="text-[11px] text-gray-500 block mb-1">时间</label>
                          <input
                            type="text"
                            value={editForm.time}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                            placeholder="HH:MM"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-[11px] text-gray-500 block mb-1">任务内容</label>
                          <input
                            type="text"
                            value={editForm.task}
                            onChange={(e) => setEditForm({ ...editForm, task: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                            placeholder="任务内容"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[11px] text-gray-500 block mb-1">负责人</label>
                          <input
                            type="text"
                            value={editForm.assignee}
                            onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                            placeholder="负责人姓名"
                          />
                        </div>
                        <div className="flex-1 min-w-[100px] max-w-[140px]">
                          <label className="text-[11px] text-gray-500 block mb-1">角色</label>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as TaskRole })}
                            className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                            style={{ backgroundColor: '#33b89a', color: '#fff' }}
                          >
                            <Check size={14} />
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                          >
                            <X size={14} />
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={task.id}
                  className="relative flex items-start gap-4 group py-3 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors print:hover:bg-transparent"
                >
                  <button
                    onClick={() => handleCycleStatus(task.id, task.status)}
                    className="relative z-10 mt-0.5 flex items-center justify-center w-[23px] h-[23px] rounded-full border-2 bg-[#0f0f1a] print:bg-white focus:outline-none print:cursor-default"
                    style={{ borderColor: task.status === 'pending' ? '#4b5563' : task.status === 'in_progress' ? '#e2a04a' : '#33b89a' }}
                  >
                    <Icon
                      size={12}
                      className={`${STATUS_COLOR[task.status]} ${task.status === 'in_progress' ? 'animate-spin' : ''}`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded print:bg-gray-100 print:text-black"
                        style={{ backgroundColor: '#e2a04a22', color: '#e2a04a' }}
                      >
                        {task.time}
                      </span>
                      <span className="text-white text-sm print:text-black">
                        {task.task}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-gray-400 text-xs print:text-gray-600">
                        {task.assignee}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded text-white ${ROLE_COLORS[task.role]}`}
                      >
                        {ROLE_LABELS[task.role]}
                      </span>
                    </div>
                  </div>

                  <div className="print:hidden flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(task)}
                      className="p-1.5 rounded text-gray-400 hover:text-[#e2a04a] hover:bg-white/5 transition-colors"
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-[#c84b31] hover:bg-white/5 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}

            {isAddingNew && (
              <div className="relative flex items-start gap-4 py-3 px-2 -mx-2 rounded-lg bg-[#e2a04a]/10 border border-[#e2a04a]/20">
                <div className="relative z-10 mt-0.5 flex items-center justify-center w-[23px] h-[23px] rounded-full border-2 border-dashed border-[#e2a04a]/50 bg-[#0f0f1a]">
                  <Plus size={12} className="text-[#e2a04a]" />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[100px] max-w-[140px]">
                      <label className="text-[11px] text-gray-500 block mb-1">时间</label>
                      <input
                        type="text"
                        value={newTaskForm.time}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, time: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                        placeholder="HH:MM"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[11px] text-gray-500 block mb-1">任务内容</label>
                      <input
                        type="text"
                        value={newTaskForm.task}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, task: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                        placeholder="任务内容"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[11px] text-gray-500 block mb-1">负责人</label>
                      <input
                        type="text"
                        value={newTaskForm.assignee}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                        placeholder="负责人姓名"
                      />
                    </div>
                    <div className="flex-1 min-w-[100px] max-w-[140px]">
                      <label className="text-[11px] text-gray-500 block mb-1">角色</label>
                      <select
                        value={newTaskForm.role}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, role: e.target.value as TaskRole })}
                        className="w-full px-2.5 py-1.5 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={handleSaveNew}
                        disabled={!newTaskForm.task.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
                      >
                        <Plus size={14} />
                        添加
                      </button>
                      <button
                        onClick={handleCancelAdd}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                      >
                        <X size={14} />
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {tasks.length === 0 && !isAddingNew && (
            <div className="ml-[11px] pl-6 py-10 border-l border-dashed border-white/10 print:border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-4">暂无任务，点击下方按钮添加临时任务</div>
              </div>
            </div>
          )}

          {!isAddingNew && (
            <div className="print:hidden mt-4 ml-[11px] pl-6">
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-2 text-sm text-[#e2a04a] hover:text-[#e2a04a]/80 transition-colors"
              >
                <Plus size={16} />
                新增任务
              </button>
            </div>
          )}
        </div>
      </main>

      <div className="print:hidden shrink-0 border-t border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Printer size={16} />
            打印清单
          </button>
          <button
            onClick={() => setShowConfirmationSlip(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Receipt size={16} />
            生成顾客确认单
          </button>
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={16} />
            重新生成清单
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoToQuotation}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
            返回报价页
          </button>
          <button
            onClick={() => navigate('/inquiry')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
          >
            <Plus size={16} />
            新建询价
          </button>
        </div>
      </div>

      {showBulkTransfer && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md mx-4 border border-white/10">
            <h3
              className="text-lg font-bold text-white mb-4"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive" }}
            >
              批量转派任务
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">来源角色</label>
                <select
                  value={bulkFromRole}
                  onChange={(e) => setBulkFromRole(e.target.value as 'all' | TaskRole)}
                  className="w-full px-3 py-2 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                >
                  {BULK_FROM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">新负责人</label>
                <input
                  type="text"
                  value={bulkToAssignee}
                  onChange={(e) => setBulkToAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                  placeholder="请输入姓名，如：小王"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">新角色</label>
                <select
                  value={bulkToRole}
                  onChange={(e) => setBulkToRole(e.target.value as TaskRole)}
                  className="w-full px-3 py-2 text-sm rounded bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e2a04a]"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkTransfer(false)
                  setBulkFromRole('all')
                  setBulkToAssignee('')
                  setBulkToRole('front_desk')
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBulkTransfer}
                disabled={!bulkToAssignee.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
              >
                确认转派
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmationSlip && quotation && inquiry && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-lg mx-4 border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="bg-white rounded-lg p-6 text-black" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              <h2
                className="text-xl font-bold text-center mb-4"
                style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive" }}
              >
                生日包场确认单
              </h2>
              <div className="border-t border-gray-300 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">日期：</span>
                  <span className="font-medium">{inquiry.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">时间：</span>
                  <span className="font-medium">{quotation.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">人数：</span>
                  <span className="font-medium">{inquiry.guestCount}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">客户姓名：</span>
                  <span className="font-medium">{inquiry.customerName}</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold mb-2 text-gray-800">剧本清单</div>
                <div className="space-y-1.5">
                  {quotation.selectedScripts.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span>{s.name}</span>
                      <span className="text-gray-600">{SCRIPT_TYPE_LABELS[s.type]} · {s.duration}小时</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold mb-2 text-gray-800">费用明细</div>
                <div className="space-y-1.5">
                  {Object.entries(categorySubtotals).map(([label, amount]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">¥{amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {quotation.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>优惠</span>
                      <span className="text-[#c84b31]">-¥{quotation.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>总计</span>
                    <span style={{ color: '#e2a04a' }}>¥{quotation.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-200 space-y-2 text-sm">
                {quotation.depositAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">已收订金{quotation.depositMethod ? `（${PAYMENT_METHOD_LABELS[quotation.depositMethod]}）` : ''}：</span>
                    <span className="text-[#33b89a] font-medium">¥{quotation.depositAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">尾款：</span>
                  <span className="font-medium" style={{ color: remaining > 0 ? '#c84b31' : '#33b89a' }}>
                    ¥{remaining.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
                感谢您的预订，如有疑问请联系店长
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={handleCopyConfirmation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                <Copy size={14} />
                {copied ? '已复制' : '复制内容'}
              </button>
              <button
                onClick={() => setShowConfirmationSlip(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#e2a04a', color: '#0f0f1a' }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegenerateConfirm && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md mx-4 border border-white/10">
            <h3
              className="text-lg font-bold text-white mb-2"
              style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive" }}
            >
              确认重新生成
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              重新生成清单将覆盖所有自定义修改，恢复为系统自动生成的模板。此操作不可撤销。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#c84b31', color: '#fff' }}
              >
                确认重新生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
