import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  InquiryData,
  QuotationData,
  ChecklistData,
  Script,
  ChecklistTask,
  RoomType,
  TaskRole,
  PaymentMethod,
} from '@/types'
import { MOCK_SCRIPTS, STORE_CONFIG } from '@/data/scripts'
import { parseTimeToMinutes } from '@/utils/checklist'

interface AppState {
  inquiries: InquiryData[]
  quotations: QuotationData[]
  checklists: ChecklistData[]
  currentInquiryId: string | null
  currentQuotationId: string | null
  currentChecklistId: string | null
  occupiedSlots: Record<string, string[]>

  addInquiry: (inquiry: InquiryData) => void
  updateInquiry: (id: string, data: Partial<InquiryData>) => void
  setCurrentInquiryId: (id: string | null) => void

  addQuotation: (quotation: QuotationData) => void
  updateQuotation: (id: string, data: Partial<QuotationData>) => void
  confirmQuotation: (id: string, depositAmount?: number, depositMethod?: PaymentMethod) => void
  markFinalPaid: (id: string, method: PaymentMethod) => void
  setCurrentQuotationId: (id: string | null) => void

  addChecklist: (checklist: ChecklistData) => void
  updateTaskStatus: (checklistId: string, taskId: string, status: ChecklistTask['status']) => void
  updateTask: (checklistId: string, taskId: string, data: Partial<ChecklistTask>) => void
  addTask: (checklistId: string, task: Omit<ChecklistTask, 'id'>) => void
  deleteTask: (checklistId: string, taskId: string) => void
  reorderTasks: (checklistId: string, taskIds: string[]) => void
  replaceAllTasks: (checklistId: string, tasks: ChecklistTask[]) => void
  setCurrentChecklistId: (id: string | null) => void
  transferTasksFromTo: (fromAssignee: string, toAssignee: string, toRole: TaskRole, date?: string) => number

  getAvailableScripts: (guestCount: number, ageGroup: string, roomType?: string) => Script[]
  getSuitableRoomType: (guestCount: number) => RoomType | 'mixed'
  occupySlot: (date: string, slot: string) => void
  releaseSlot: (date: string, slot: string) => void

  getTodayConfirmed: (date: string) => { inquiry: InquiryData; quotation: QuotationData; checklist?: ChecklistData }[]
  getTasksForDate: (date: string) => { task: ChecklistTask; checklistId: string; quotationId: string; inquiryId: string }[]

  resetAll: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      inquiries: [],
      quotations: [],
      checklists: [],
      currentInquiryId: null,
      currentQuotationId: null,
      currentChecklistId: null,
      occupiedSlots: {},

      addInquiry: (inquiry) =>
        set((state) => ({
          inquiries: [...state.inquiries, inquiry],
          currentInquiryId: inquiry.id,
        })),

      updateInquiry: (id, data) =>
        set((state) => ({
          inquiries: state.inquiries.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        })),

      setCurrentInquiryId: (id) => set({ currentInquiryId: id }),

      addQuotation: (quotation) =>
        set((state) => ({
          quotations: [...state.quotations, quotation],
          currentQuotationId: quotation.id,
        })),

      updateQuotation: (id, data) =>
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id ? { ...q, ...data } : q
          ),
        })),

      confirmQuotation: (id, depositAmount = 0, depositMethod = '') =>
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  confirmed: true,
                  depositAmount,
                  depositMethod: depositMethod as PaymentMethod | '',
                }
              : q
          ),
        })),

      markFinalPaid: (id, method) =>
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  finalPaid: true,
                  finalPaymentMethod: method,
                }
              : q
          ),
        })),

      setCurrentQuotationId: (id) => set({ currentQuotationId: id }),

      addChecklist: (checklist) =>
        set((state) => ({
          checklists: [...state.checklists, checklist],
          currentChecklistId: checklist.id,
        })),

      updateTaskStatus: (checklistId, taskId, status) =>
        set((state) => ({
          checklists: state.checklists.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  tasks: c.tasks.map((t) =>
                    t.id === taskId ? { ...t, status } : t
                  ),
                }
              : c
          ),
        })),

      updateTask: (checklistId, taskId, data) =>
        set((state) => ({
          checklists: state.checklists.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  tasks: c.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...data, isCustomEdited: true } : t
                  ),
                }
              : c
          ),
        })),

      addTask: (checklistId, task) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
        const newTask: ChecklistTask = { ...task, id, isCustomEdited: true }
        set((state) => ({
          checklists: state.checklists.map((c) => {
            if (c.id !== checklistId) return c
            const allTasks = [...c.tasks, newTask]
            allTasks.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
            return { ...c, tasks: allTasks }
          }),
        }))
      },

      deleteTask: (checklistId, taskId) =>
        set((state) => ({
          checklists: state.checklists.map((c) =>
            c.id === checklistId
              ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
              : c
          ),
        })),

      reorderTasks: (checklistId, taskIds) =>
        set((state) => ({
          checklists: state.checklists.map((c) => {
            if (c.id !== checklistId) return c
            const ordered = taskIds
              .map((id) => c.tasks.find((t) => t.id === id))
              .filter(Boolean) as ChecklistTask[]
            const remaining = c.tasks.filter((t) => !taskIds.includes(t.id))
            return { ...c, tasks: [...ordered, ...remaining] }
          }),
        })),

      replaceAllTasks: (checklistId, tasks) =>
        set((state) => ({
          checklists: state.checklists.map((c) =>
            c.id === checklistId ? { ...c, tasks } : c
          ),
        })),

      setCurrentChecklistId: (id) => set({ currentChecklistId: id }),

      transferTasksFromTo: (fromAssignee, toAssignee, toRole, date) => {
        const { checklists, getTasksForDate } = get()
        const todaysTasks = date ? getTasksForDate(date) : getTasksForDate(new Date().toISOString().slice(0, 10))
        const checklistUpdates: Record<string, ChecklistTask[]> = {}

        todaysTasks.forEach(({ task, checklistId }) => {
          if (task.assignee === fromAssignee) {
            if (!checklistUpdates[checklistId]) {
              const cl = checklists.find(c => c.id === checklistId)
              checklistUpdates[checklistId] = cl ? [...cl.tasks] : []
            }
            const tasks = checklistUpdates[checklistId]
            const idx = tasks.findIndex(t => t.id === task.id)
            if (idx !== -1) {
              tasks[idx] = { ...tasks[idx], assignee: toAssignee, role: toRole, isCustomEdited: true }
            }
          }
        })

        let count = 0
        Object.entries(checklistUpdates).forEach(([cid, tasks]) => {
          count += tasks.filter(t => t.assignee === toAssignee).length
        })

        set((state) => ({
          checklists: state.checklists.map((c) =>
            checklistUpdates[c.id] ? { ...c, tasks: checklistUpdates[c.id] } : c
          ),
        }))

        return count
      },

      getAvailableScripts: (guestCount, ageGroup, roomType) => {
        return MOCK_SCRIPTS.filter((script) => {
          const capacityOk = guestCount >= script.minPlayers && guestCount <= script.maxPlayers
          const ageOk = script.suitableAge.includes(ageGroup as never)
          let roomOk = true
          if (roomType) {
            roomOk =
              script.roomRequirement === roomType ||
              (roomType === 'large' && script.roomRequirement !== 'large') ||
              (roomType === 'medium' && script.roomRequirement === 'small')
          }
          return capacityOk && ageOk && roomOk
        })
      },

      getSuitableRoomType: (guestCount) => {
        if (guestCount <= 6) return 'small'
        if (guestCount <= 8) return 'medium'
        if (guestCount <= 12) return 'large'
        return 'mixed'
      },

      occupySlot: (date, slot) =>
        set((state) => {
          const current = state.occupiedSlots[date] || []
          if (current.includes(slot)) return state
          return {
            occupiedSlots: {
              ...state.occupiedSlots,
              [date]: [...current, slot],
            },
          }
        }),

      releaseSlot: (date, slot) =>
        set((state) => {
          const current = state.occupiedSlots[date] || []
          if (!current.includes(slot)) return state
          return {
            occupiedSlots: {
              ...state.occupiedSlots,
              [date]: current.filter((s) => s !== slot),
            },
          }
        }),

      getTodayConfirmed: (date) => {
        const { quotations, inquiries, checklists } = get()
        return quotations
          .filter((q) => q.confirmed)
          .map((q) => {
            const inquiry = inquiries.find((i) => i.id === q.inquiryId)
            const checklist = checklists.find((c) => c.quotationId === q.id)
            if (!inquiry || inquiry.date !== date) return null
            return { inquiry, quotation: q, checklist }
          })
          .filter(Boolean) as { inquiry: InquiryData; quotation: QuotationData; checklist?: ChecklistData }[]
      },

      getTasksForDate: (date) => {
        const { quotations, inquiries, checklists } = get()
        const results: { task: ChecklistTask; checklistId: string; quotationId: string; inquiryId: string }[] = []

        checklists.forEach((cl) => {
          const quotation = quotations.find((q) => q.id === cl.quotationId)
          if (!quotation || !quotation.confirmed) return
          const inquiry = inquiries.find((i) => i.id === quotation.inquiryId)
          if (!inquiry || inquiry.date !== date) return

          cl.tasks.forEach((task) => {
            results.push({
              task,
              checklistId: cl.id,
              quotationId: quotation.id,
              inquiryId: inquiry.id,
            })
          })
        })

        return results
      },

      resetAll: () =>
        set({
          inquiries: [],
          quotations: [],
          checklists: [],
          currentInquiryId: null,
          currentQuotationId: null,
          currentChecklistId: null,
          occupiedSlots: {},
        }),
    }),
    {
      name: 'birthday-party-tool',
    }
  )
)

export { STORE_CONFIG }
