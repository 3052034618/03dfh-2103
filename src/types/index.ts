export type AgeGroup = 'child' | 'teen' | 'adult' | 'mixed'
export type ScriptType = 'joy' | 'emotion' | 'terror' | 'reasoning' | 'mechanism'
export type RoomType = 'small' | 'medium' | 'large'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ItemCategory = 'base' | 'decoration' | 'cake' | 'alcohol' | 'overtime' | 'dm' | 'other'
export type TaskRole = 'front_desk' | 'dm' | 'logistics'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface Script {
  id: string
  name: string
  type: ScriptType
  minPlayers: number
  maxPlayers: number
  duration: number
  roomRequirement: RoomType
  difficulty: Difficulty
  pricePerPerson: number
  suitableAge: AgeGroup[]
  description: string
}

export interface InquiryData {
  id: string
  customerName: string
  customerPhone: string
  guestCount: number
  ageGroup: AgeGroup
  date: string
  timeSlot: string
  needPrivateRoom: boolean
  roomType: RoomType
  bringCake: boolean
  bringAlcohol: boolean
  needDMHost: boolean
  notes: string
  createdAt: string
}

export interface QuotationItem {
  id: string
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
  category: ItemCategory
}

export interface QuotationData {
  id: string
  inquiryId: string
  selectedScripts: Script[]
  timeSlot: string
  items: QuotationItem[]
  discount: number
  totalPrice: number
  confirmed: boolean
  createdAt: string
}

export interface ChecklistTask {
  id: string
  time: string
  task: string
  assignee: string
  role: TaskRole
  status: TaskStatus
}

export interface ChecklistData {
  id: string
  quotationId: string
  inquiryId: string
  tasks: ChecklistTask[]
  createdAt: string
}

export interface StoreConfig {
  rooms: { id: string; name: string; type: RoomType; capacity: number }[]
  timeSlots: string[]
  overtimeRatePerHour: number
  birthdayDecorationFee: number
  cakeConsignmentFee: number
  alcoholServiceFee: number
  dmHostFee: number
}

export const SCRIPT_TYPE_LABELS: Record<ScriptType, string> = {
  joy: '欢乐',
  emotion: '情感',
  terror: '恐怖',
  reasoning: '推理',
  mechanism: '机制',
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  child: '儿童(6-12岁)',
  teen: '青少年(13-17岁)',
  adult: '成人(18+)',
  mixed: '混合年龄段',
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  small: '小房间(4-6人)',
  medium: '中房间(6-8人)',
  large: '大房间(8-12人)',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '入门',
  medium: '进阶',
  hard: '硬核',
}

export const ROLE_LABELS: Record<TaskRole, string> = {
  front_desk: '前台',
  dm: 'DM',
  logistics: '后勤',
}

export const ROLE_COLORS: Record<TaskRole, string> = {
  front_desk: 'bg-blue-500',
  dm: 'bg-amber-500',
  logistics: 'bg-emerald-500',
}
