import type { ChecklistTask, InquiryData, Script, OrderStatus, ChecklistData, QuotationData } from '@/types'

export function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.replace('次日 ', '').trim()
  const isNextDay = timeStr.includes('次日')
  const [h, m] = clean.split(':').map(Number)
  let minutes = h * 60 + m
  if (isNextDay) minutes += 24 * 60
  return minutes
}

export function minutesToTimeDisplay(totalMinutes: number): { display: string; isNextDay: boolean } {
  const isNextDay = totalMinutes >= 24 * 60
  const displayMinutes = totalMinutes % (24 * 60)
  const h = Math.floor(displayMinutes / 60)
  const m = displayMinutes % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const prefix = isNextDay ? '次日 ' : ''
  return { display: `${prefix}${hh}:${mm}`, isNextDay }
}

export function generateChecklistTasks(
  inquiry: InquiryData,
  selectedScripts: Script[]
): ChecklistTask[] {
  const tasks: ChecklistTask[] = []
  let counter = 0
  const nextId = () => `ct_${++counter}_${Date.now()}`

  const baseMinutes = parseTimeToMinutes(inquiry.timeSlot)

  const fmt = (minutes: number) => minutesToTimeDisplay(minutes).display

  tasks.push({
    id: nextId(),
    time: fmt(baseMinutes - 60),
    task: '布置生日主题装饰（气球、横幅、桌面摆件）',
    assignee: '后勤组',
    role: 'logistics',
    status: 'pending',
  })

  if (inquiry.bringCake) {
    tasks.push({
      id: nextId(),
      time: fmt(baseMinutes - 60),
      task: '准备蛋糕冷藏/代收，检查蜡烛、刀叉',
      assignee: '前台组',
      role: 'front_desk',
      status: 'pending',
    })
  }

  tasks.push({
    id: nextId(),
    time: fmt(baseMinutes - 30),
    task: '检查房间灯光、音响、道具是否就绪',
    assignee: '后勤组',
    role: 'logistics',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: inquiry.timeSlot,
    task: '迎接顾客，引导至包间，确认到场人数',
    assignee: '前台组',
    role: 'front_desk',
    status: 'pending',
  })

  const scriptNames = selectedScripts.map((s) => s.name).join(' + ')
  tasks.push({
    id: nextId(),
    time: fmt(baseMinutes + 15),
    task: `开本：${scriptNames}`,
    assignee: 'DM组',
    role: 'dm',
    status: 'pending',
  })

  const scriptDuration = selectedScripts.reduce((s, sc) => s + sc.duration, 0)
  const midpointMinutes = baseMinutes + Math.floor(scriptDuration / 2 * 60)

  if (inquiry.bringCake) {
    tasks.push({
      id: nextId(),
      time: fmt(midpointMinutes),
      task: '暂停剧本，切蛋糕、唱生日歌',
      assignee: 'DM组',
      role: 'dm',
      status: 'pending',
    })

    tasks.push({
      id: nextId(),
      time: fmt(midpointMinutes + 10),
      task: '拍合照（主宾C位，全体合影）',
      assignee: '前台组',
      role: 'front_desk',
      status: 'pending',
    })

    tasks.push({
      id: nextId(),
      time: fmt(midpointMinutes + 15),
      task: '继续剧本',
      assignee: 'DM组',
      role: 'dm',
      status: 'pending',
    })
  }

  const endMinutes = baseMinutes + Math.ceil(scriptDuration * 60)
  tasks.push({
    id: nextId(),
    time: fmt(endMinutes),
    task: '剧本结束，欢送顾客，收取尾款',
    assignee: '前台组',
    role: 'front_desk',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: fmt(endMinutes + 15),
    task: '清理房间，恢复原状',
    assignee: '后勤组',
    role: 'logistics',
    status: 'pending',
  })

  return tasks
}

export function computeOrderStatus(checklist?: ChecklistData, quotation?: QuotationData): OrderStatus {
  if (!checklist || !quotation || !quotation.confirmed) return 'not_started'
  const tasks = checklist.tasks
  if (tasks.length === 0) return 'not_started'

  const doneCount = tasks.filter(t => t.status === 'done').length
  const totalCount = tasks.length

  if (doneCount === totalCount) {
    if (!quotation.finalPaid) return 'wrapping_up'
    return 'completed'
  }

  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  if (doneCount > 0 || inProgressCount > 0) return 'in_progress'
  return 'not_started'
}

export function getNextPendingTask(checklist?: ChecklistData): ChecklistTask | undefined {
  if (!checklist || checklist.tasks.length === 0) return undefined
  return checklist.tasks.find(t => t.status !== 'done')
}

export function shiftChecklistTime(
  tasks: ChecklistTask[],
  oldBaseMinutes: number,
  newBaseMinutes: number,
  preserveEdited: boolean = true
): ChecklistTask[] {
  const delta = newBaseMinutes - oldBaseMinutes

  return tasks.map((task) => {
    if (preserveEdited && task.isCustomEdited) {
      const oldTaskMinutes = parseTimeToMinutes(task.time)
      const newMinutes = oldTaskMinutes + delta
      return {
        ...task,
        time: minutesToTimeDisplay(newMinutes).display,
      }
    } else {
      const oldTaskMinutes = parseTimeToMinutes(task.time)
      const newMinutes = oldTaskMinutes + delta
      return {
        ...task,
        time: minutesToTimeDisplay(newMinutes).display,
      }
    }
  })
}

export function hasCustomEdited(tasks: ChecklistTask[]): boolean {
  return tasks.some(t => t.isCustomEdited)
}

export function sortTasksByTime(tasks: ChecklistTask[]): ChecklistTask[] {
  return [...tasks].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
}
