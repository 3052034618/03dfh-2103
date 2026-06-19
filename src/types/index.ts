export type AgeGroup = 'child' | 'teen' | 'adult' | 'mixed'
export type ScriptType = 'joy' | 'emotion' | 'terror' | 'reasoning' | 'mechanism'
export type RoomType = 'small' | 'medium' | 'large'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ItemCategory = 'base' | 'decoration' | 'cake' | 'alcohol' | 'overtime' | 'dm' | 'other'
export type TaskRole = 'front_desk' | 'dm' | 'logistics'
export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card' | 'bank'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type OrderStatus = 'not_started' | 'in_progress' | 'completed' | 'wrapping_up'
export type ViewMode = 'schedule' | 'payment' | 'staff'

export interface Employee {
  id: string
  name: string
  role: TaskRole
  phone: string
  avatar?: string
}

export interface ScheduleEntry {
  employeeId: string
  shift: 'morning' | 'afternoon' | 'evening' | 'all'
}

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
  depositAmount: number
  depositMethod: PaymentMethod | ''
  finalPaid: boolean
  finalPaymentMethod: PaymentMethod | ''
  createdAt: string
}

export interface ChecklistTask {
  id: string
  time: string
  task: string
  assignee: string
  role: TaskRole
  status: TaskStatus
  isCustomEdited?: boolean
}

export interface ChecklistData {
  id: string
  quotationId: string
  inquiryId: string
  tasks: ChecklistTask[]
  createdAt: string
  lastShiftMinutes?: number
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '刷卡',
  bank: '银行转账',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  wrapping_up: '待收尾',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  not_started: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
  in_progress: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  wrapping_up: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
}
