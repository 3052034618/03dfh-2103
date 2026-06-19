import type { QuotationItem, InquiryData, Script, ItemCategory } from '@/types'
import { STORE_CONFIG } from '@/data/scripts'

export function generateQuotationItems(
  inquiry: InquiryData,
  selectedScripts: Script[]
): QuotationItem[] {
  const items: QuotationItem[] = []
  let counter = 0
  const nextId = () => `qi_${++counter}_${Date.now()}`

  selectedScripts.forEach((script) => {
    items.push({
      id: nextId(),
      name: `${script.name} · 基础场费`,
      unitPrice: script.pricePerPerson,
      quantity: inquiry.guestCount,
      subtotal: script.pricePerPerson * inquiry.guestCount,
      category: 'base',
    })
  })

  items.push({
    id: nextId(),
    name: '生日主题布置',
    unitPrice: STORE_CONFIG.birthdayDecorationFee,
    quantity: 1,
    subtotal: STORE_CONFIG.birthdayDecorationFee,
    category: 'decoration',
  })

  if (inquiry.bringCake) {
    items.push({
      id: nextId(),
      name: '蛋糕代收/冷藏',
      unitPrice: STORE_CONFIG.cakeConsignmentFee,
      quantity: 1,
      subtotal: STORE_CONFIG.cakeConsignmentFee,
      category: 'cake',
    })
  }

  if (inquiry.bringAlcohol) {
    items.push({
      id: nextId(),
      name: '酒水服务费',
      unitPrice: STORE_CONFIG.alcoholServiceFee,
      quantity: 1,
      subtotal: STORE_CONFIG.alcoholServiceFee,
      category: 'alcohol',
    })
  }

  if (inquiry.needDMHost) {
    items.push({
      id: nextId(),
      name: 'DM主持生日环节',
      unitPrice: STORE_CONFIG.dmHostFee,
      quantity: 1,
      subtotal: STORE_CONFIG.dmHostFee,
      category: 'dm',
    })
  }

  const totalDuration = selectedScripts.reduce((sum, s) => sum + s.duration, 0)
  const standardHours = 4
  if (totalDuration > standardHours) {
    const overtimeHours = totalDuration - standardHours
    items.push({
      id: nextId(),
      name: `加时费(${overtimeHours}小时)`,
      unitPrice: STORE_CONFIG.overtimeRatePerHour,
      quantity: overtimeHours,
      subtotal: STORE_CONFIG.overtimeRatePerHour * overtimeHours,
      category: 'overtime',
    })
  }

  return items
}

export function calculateTotal(items: QuotationItem[], discount: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  return Math.max(0, subtotal - discount)
}

export function getCategoryLabel(category: ItemCategory): string {
  const labels: Record<ItemCategory, string> = {
    base: '基础场费',
    decoration: '布置',
    cake: '蛋糕',
    alcohol: '酒水',
    overtime: '加时',
    dm: 'DM主持',
    other: '其他',
  }
  return labels[category]
}
