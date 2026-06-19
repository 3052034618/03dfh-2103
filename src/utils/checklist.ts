import type { ChecklistTask, InquiryData, Script, TaskRole } from '@/types'

export function generateChecklistTasks(
  inquiry: InquiryData,
  selectedScripts: Script[]
): ChecklistTask[] {
  const tasks: ChecklistTask[] = []
  let counter = 0
  const nextId = () => `ct_${++counter}_${Date.now()}`

  const [hourStr] = inquiry.timeSlot.split(':')
  const baseHour = parseInt(hourStr, 10)

  const fmt = (h: number, m: number) => {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return `${hh}:${mm}`
  }

  tasks.push({
    id: nextId(),
    time: fmt(baseHour - 1, 0),
    task: '布置生日主题装饰（气球、横幅、桌面摆件）',
    assignee: '后勤组',
    role: 'logistics',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: fmt(baseHour - 1, 0),
    task: '准备蛋糕冷藏/代收，检查蜡烛、刀叉',
    assignee: '前台组',
    role: 'front_desk',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: fmt(baseHour - 0, 30),
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
    time: fmt(baseHour, 15),
    task: `开本：${scriptNames}`,
    assignee: 'DM组',
    role: 'dm',
    status: 'pending',
  })

  const scriptDuration = selectedScripts.reduce((s, sc) => s + sc.duration, 0)
  const cakeHour = baseHour + Math.floor(scriptDuration / 2)
  const cakeMin = (scriptDuration % 2) * 30
  tasks.push({
    id: nextId(),
    time: fmt(cakeHour, cakeMin),
    task: '暂停剧本，切蛋糕、唱生日歌',
    assignee: 'DM组',
    role: 'dm',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: fmt(cakeHour, cakeMin + 10),
    task: '拍合照（主宾C位，全体合影）',
    assignee: '前台组',
    role: 'front_desk',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: fmt(cakeHour, cakeMin + 15),
    task: '继续剧本',
    assignee: 'DM组',
    role: 'dm',
    status: 'pending',
  })

  const endHour = baseHour + Math.ceil(scriptDuration)
  tasks.push({
    id: nextId(),
    time: fmt(endHour, 0),
    task: '剧本结束，欢送顾客，收取尾款',
    assignee: '前台组',
    role: 'front_desk',
    status: 'pending',
  })

  tasks.push({
    id: nextId(),
    time: fmt(endHour, 15),
    task: '清理房间，恢复原状',
    assignee: '后勤组',
    role: 'logistics',
    status: 'pending',
  })

  return tasks
}
