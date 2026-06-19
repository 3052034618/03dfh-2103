import type { ChecklistTask, InquiryData, Script, TaskRole } from '@/types'

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
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
