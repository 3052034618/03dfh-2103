import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InquiryData, QuotationData, ChecklistData, Script } from '@/types'
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
  updateTaskStatus: (checklistId: string, taskId: string, status: ChecklistData['tasks'][0]['status']) => void
  setCurrentChecklistId: (id: string | null) => void

  getAvailableScripts: (guestCount: number, ageGroup: string, roomType: string) => Script[]
  occupySlot: (date: string, slot: string) => void

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

      setCurrentChecklistId: (id) => set({ currentChecklistId: id }),

      getAvailableScripts: (guestCount, ageGroup, roomType) => {
        return MOCK_SCRIPTS.filter((script) => {
          const capacityOk = guestCount >= script.minPlayers && guestCount <= script.maxPlayers
          const ageOk = script.suitableAge.includes(ageGroup as never)
          const roomOk =
            !roomType ||
            script.roomRequirement === roomType ||
            (roomType === 'large' && script.roomRequirement !== 'large') ||
            (roomType === 'medium' && script.roomRequirement === 'small')
          return capacityOk && ageOk && roomOk
        })
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
