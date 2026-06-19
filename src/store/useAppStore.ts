import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InquiryData, QuotationData, ChecklistData, Script, ChecklistTask, RoomType, TaskRole } from '@/types'
import { MOCK_SCRIPTS, STORE_CONFIG } from '@/data/scripts'

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
  confirmQuotation: (id: string) => void
  setCurrentQuotationId: (id: string | null) => void

  addChecklist: (checklist: ChecklistData) => void
  updateTaskStatus: (checklistId: string, taskId: string, status: ChecklistTask['status']) => void
  updateTask: (checklistId: string, taskId: string, data: Partial<ChecklistTask>) => void
  addTask: (checklistId: string, task: Omit<ChecklistTask, 'id'>) => void
  deleteTask: (checklistId: string, taskId: string) => void
  reorderTasks: (checklistId: string, taskIds: string[]) => void
  setCurrentChecklistId: (id: string | null) => void

  getAvailableScripts: (guestCount: number, ageGroup: string, roomType?: string) => Script[]
  getSuitableRoomType: (guestCount: number) => RoomType | 'mixed'
  occupySlot: (date: string, slot: string) => void
  releaseSlot: (date: string, slot: string) => void

  getTodayConfirmed: (date: string) => { inquiry: InquiryData; quotation: QuotationData; checklist?: ChecklistData }[]

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

      confirmQuotation: (id) =>
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id ? { ...q, confirmed: true } : q
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
                    t.id === taskId ? { ...t, ...data } : t
                  ),
                }
              : c
          ),
        })),

      addTask: (checklistId, task) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
        const newTask = { ...task, id }
        set((state) => ({
          checklists: state.checklists.map((c) => {
            if (c.id !== checklistId) return c
            const allTasks = [...c.tasks, newTask]
            allTasks.sort((a, b) => a.time.localeCompare(b.time))
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

      setCurrentChecklistId: (id) => set({ currentChecklistId: id }),

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
