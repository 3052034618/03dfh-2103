import type { Employee, ScheduleEntry } from '@/types'

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e1', name: '小李', role: 'front_desk', phone: '13800000001' },
  { id: 'e2', name: '小王', role: 'front_desk', phone: '13800000002' },
  { id: 'e3', name: '阿杰', role: 'dm', phone: '13800000003' },
  { id: 'e4', name: '桃子', role: 'dm', phone: '13800000004' },
  { id: 'e5', name: '大龙', role: 'dm', phone: '13800000005' },
  { id: 'e6', name: '张叔', role: 'logistics', phone: '13800000006' },
  { id: 'e7', name: '芳姨', role: 'logistics', phone: '13800000007' },
]

export function getDefaultScheduleForDate(date: string): ScheduleEntry[] {
  const dow = new Date(date).getDay()
  const weekdaySchedule = [
    { employeeId: 'e1', shift: 'all' as const },
    { employeeId: 'e3', shift: 'all' as const },
    { employeeId: 'e6', shift: 'all' as const },
  ]
  const weekendSchedule = [
    { employeeId: 'e1', shift: 'morning' as const },
    { employeeId: 'e2', shift: 'evening' as const },
    { employeeId: 'e3', shift: 'morning' as const },
    { employeeId: 'e4', shift: 'afternoon' as const },
    { employeeId: 'e5', shift: 'evening' as const },
    { employeeId: 'e6', shift: 'morning' as const },
    { employeeId: 'e7', shift: 'evening' as const },
  ]
  return dow === 0 || dow === 6 ? weekendSchedule : weekdaySchedule
}

export function getEmployeeName(id: string): string {
  const emp = MOCK_EMPLOYEES.find(e => e.id === id)
  return emp ? emp.name : id
}

export function getEmployeeRole(id: string): Employee['role'] | undefined {
  const emp = MOCK_EMPLOYEES.find(e => e.id === id)
  return emp?.role
}
