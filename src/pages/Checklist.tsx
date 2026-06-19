import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Loader, Printer, Plus, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS, ROLE_COLORS } from '@/types'
import type { TaskStatus } from '@/types'
import { generateChecklistTasks } from '@/utils/checklist'

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

export default function Checklist() {
  const navigate = useNavigate()
  const currentQuotationId = useAppStore((s) => s.currentQuotationId)
  const quotations = useAppStore((s) => s.quotations)
  const inquiries = useAppStore((s) => s.inquiries)
  const checklists = useAppStore((s) => s.checklists)
  const addChecklist = useAppStore((s) => s.addChecklist)
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus)

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

  const handleCycleStatus = (taskId: string, current: TaskStatus) => {
    if (!checklist) return
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    updateTaskStatus(checklist.id, taskId, next)
  }

  const doneCount = checklist?.tasks.filter((t) => t.status === 'done').length ?? 0
  const totalCount = checklist?.tasks.length ?? 0

  if (!currentQuotationId || !quotation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#0f0f1a' }}>
        <div className="text-gray-400 text-lg" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          尚未确认报价单，请先前往报价页面
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
            </div>
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
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {checklist && checklist.tasks.length > 0 && (
          <div className="relative ml-4">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10 print:bg-gray-300" />

            <div className="flex flex-col gap-1">
              {checklist.tasks.map((task) => {
                const Icon = STATUS_ICON[task.status]
                return (
                  <div
                    key={task.id}
                    className="relative flex items-start gap-4 group cursor-pointer py-3 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors print:hover:bg-transparent"
                    onClick={() => handleCycleStatus(task.id, task.status)}
                  >
                    <div
                      className={`relative z-10 mt-0.5 flex items-center justify-center w-[23px] h-[23px] rounded-full border-2 bg-[#0f0f1a] print:bg-white ${STATUS_CIRCLE_RING[task.status]}`}
                    >
                      <Icon
                        size={12}
                        className={`${STATUS_COLOR[task.status]} ${task.status === 'in_progress' ? 'animate-spin' : ''}`}
                      />
                    </div>

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
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden shrink-0 border-t border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <Printer size={16} />
          打印清单
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
  )
}
