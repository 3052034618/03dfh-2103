import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Calendar, DoorOpen, PartyPopper, Phone, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { AgeGroup, RoomType, InquiryData } from '@/types'
import { AGE_GROUP_LABELS, ROOM_TYPE_LABELS } from '@/types'
import { STORE_CONFIG } from '@/data/scripts'

const ageGroupOptions: AgeGroup[] = ['child', 'teen', 'adult', 'mixed']
const roomTypeOptions: RoomType[] = ['small', 'medium', 'large']

interface FormData {
  guestCount: number
  ageGroup: AgeGroup | ''
  date: string
  timeSlot: string
  needPrivateRoom: boolean
  roomType: RoomType | ''
  bringCake: boolean
  bringAlcohol: boolean
  needDMHost: boolean
  notes: string
  customerName: string
  customerPhone: string
}

const initialForm: FormData = {
  guestCount: 1,
  ageGroup: '',
  date: '',
  timeSlot: '',
  needPrivateRoom: false,
  roomType: '',
  bringCake: false,
  bringAlcohol: false,
  needDMHost: false,
  notes: '',
  customerName: '',
  customerPhone: '',
}

const sections = [
  { key: 'basic', label: '基础信息', icon: Users },
  { key: 'room', label: '房间需求', icon: DoorOpen },
  { key: 'services', label: '增值服务', icon: PartyPopper },
  { key: 'contact', label: '联系方式', icon: Phone },
] as const

export default function Inquiry() {
  const navigate = useNavigate()
  const addInquiry = useAppStore((s) => s.addInquiry)
  const [form, setForm] = useState<FormData>(initialForm)
  const [activeSection, setActiveSection] = useState<string>('basic')

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const inquiry: InquiryData = {
      id,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      guestCount: form.guestCount,
      ageGroup: form.ageGroup as AgeGroup,
      date: form.date,
      timeSlot: form.timeSlot,
      needPrivateRoom: form.needPrivateRoom,
      roomType: (form.needPrivateRoom ? form.roomType : 'small') as RoomType,
      bringCake: form.bringCake,
      bringAlcohol: form.bringAlcohol,
      needDMHost: form.needDMHost,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    }
    addInquiry(inquiry)
    navigate('/quotation')
  }

  const isSubmitDisabled =
    !form.customerName ||
    !form.customerPhone ||
    !form.ageGroup ||
    !form.date ||
    !form.timeSlot ||
    (form.needPrivateRoom && !form.roomType)

  const formatDate = (d: string) => {
    if (!d) return ''
    const date = new Date(d)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: '#0f0f1a', fontFamily: "'Noto Sans SC', sans-serif" }}
    >
      <div className="mx-auto max-w-7xl">
        <h1
          className="mb-2 text-3xl font-bold"
          style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
        >
          生日派对咨询登记
        </h1>
        <p className="mb-8 text-sm" style={{ color: '#8b8ba3' }}>
          填写以下信息，我们将为您定制专属的剧本杀生日派对方案
        </p>

        <div className="flex gap-6">
          <div className="w-2/3 space-y-5">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.key
              return (
                <div
                  key={section.key}
                  className="rounded-xl border p-6 transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? '#1a1a2e' : '#16162a',
                    borderColor: isActive ? '#e2a04a44' : '#2a2a40',
                    boxShadow: isActive ? '0 0 20px #e2a04a11' : 'none',
                  }}
                  onClick={() => setActiveSection(section.key)}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#e2a04a22' }}
                    >
                      <Icon size={18} style={{ color: '#e2a04a' }} />
                    </div>
                    <h2
                      className="text-lg font-semibold"
                      style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2e2f0' }}
                    >
                      {section.label}
                    </h2>
                  </div>

                  {section.key === 'basic' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-sm" style={{ color: '#a0a0b8' }}>
                            客人数量
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={form.guestCount}
                            onChange={(e) => update('guestCount', Math.max(1, Number(e.target.value)))}
                            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                            style={{
                              backgroundColor: '#0f0f1a',
                              borderColor: '#2a2a40',
                              color: '#e2e2f0',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#e2a04a')}
                            onBlur={(e) => (e.target.style.borderColor = '#2a2a40')}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm" style={{ color: '#a0a0b8' }}>
                            场次时间
                          </label>
                          <select
                            value={form.timeSlot}
                            onChange={(e) => update('timeSlot', e.target.value)}
                            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                            style={{
                              backgroundColor: '#0f0f1a',
                              borderColor: '#2a2a40',
                              color: form.timeSlot ? '#e2e2f0' : '#5a5a70',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#e2a04a')}
                            onBlur={(e) => (e.target.style.borderColor = '#2a2a40')}
                          >
                            <option value="">选择时间</option>
                            {STORE_CONFIG.timeSlots.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm" style={{ color: '#a0a0b8' }}>
                          活动日期
                        </label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => update('date', e.target.value)}
                          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                          style={{
                            backgroundColor: '#0f0f1a',
                            borderColor: '#2a2a40',
                            color: form.date ? '#e2e2f0' : '#5a5a70',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#e2a04a')}
                          onBlur={(e) => (e.target.style.borderColor = '#2a2a40')}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm" style={{ color: '#a0a0b8' }}>
                          年龄段
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {ageGroupOptions.map((ag) => (
                            <button
                              key={ag}
                              type="button"
                              onClick={() => update('ageGroup', ag)}
                              className="rounded-lg border px-4 py-3 text-sm transition-all duration-200"
                              style={{
                                backgroundColor: form.ageGroup === ag ? '#e2a04a22' : '#0f0f1a',
                                borderColor: form.ageGroup === ag ? '#e2a04a' : '#2a2a40',
                                color: form.ageGroup === ag ? '#e2a04a' : '#8b8ba3',
                              }}
                            >
                              {AGE_GROUP_LABELS[ag]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {section.key === 'room' && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#a0a0b8' }}>需要包间</span>
                        <button
                          type="button"
                          onClick={() => {
                            update('needPrivateRoom', !form.needPrivateRoom)
                            if (form.needPrivateRoom) update('roomType', '')
                          }}
                          className="relative h-6 w-11 rounded-full transition-colors duration-200"
                          style={{ backgroundColor: form.needPrivateRoom ? '#e2a04a' : '#2a2a40' }}
                        >
                          <span
                            className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                            style={{ left: form.needPrivateRoom ? '22px' : '2px' }}
                          />
                        </button>
                      </div>
                      {form.needPrivateRoom && (
                        <div>
                          <label className="mb-2 block text-sm" style={{ color: '#a0a0b8' }}>
                            房间类型
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {roomTypeOptions.map((rt) => (
                              <button
                                key={rt}
                                type="button"
                                onClick={() => update('roomType', rt)}
                                className="rounded-lg border px-3 py-3 text-sm transition-all duration-200"
                                style={{
                                  backgroundColor: form.roomType === rt ? '#e2a04a22' : '#0f0f1a',
                                  borderColor: form.roomType === rt ? '#e2a04a' : '#2a2a40',
                                  color: form.roomType === rt ? '#e2a04a' : '#8b8ba3',
                                }}
                              >
                                {ROOM_TYPE_LABELS[rt]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {section.key === 'services' && (
                    <div className="space-y-5">
                      {[
                        { key: 'bringCake' as const, label: '自带蛋糕', desc: `代蛋糕费 ¥${STORE_CONFIG.cakeConsignmentFee}` },
                        { key: 'bringAlcohol' as const, label: '自带酒水', desc: `酒水服务费 ¥${STORE_CONFIG.alcoholServiceFee}` },
                        { key: 'needDMHost' as const, label: 'DM主持', desc: `DM主持费 ¥${STORE_CONFIG.dmHostFee}` },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all duration-200"
                          style={{
                            backgroundColor: form[item.key] ? '#e2a04a11' : '#0f0f1a',
                            borderColor: form[item.key] ? '#e2a04a66' : '#2a2a40',
                          }}
                        >
                          <div>
                            <div className="text-sm font-medium" style={{ color: '#e2e2f0' }}>
                              {item.label}
                            </div>
                            <div className="text-xs" style={{ color: '#6a6a80' }}>
                              {item.desc}
                            </div>
                          </div>
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border transition-colors duration-200"
                            style={{
                              backgroundColor: form[item.key] ? '#e2a04a' : 'transparent',
                              borderColor: form[item.key] ? '#e2a04a' : '#3a3a50',
                            }}
                          >
                            {form[item.key] && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="#0f0f1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={form[item.key]}
                            onChange={(e) => update(item.key, e.target.checked)}
                          />
                        </label>
                      ))}
                      <div>
                        <label className="mb-1.5 block text-sm" style={{ color: '#a0a0b8' }}>
                          备注
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => update('notes', e.target.value)}
                          rows={3}
                          placeholder="其他特殊需求..."
                          className="w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                          style={{
                            backgroundColor: '#0f0f1a',
                            borderColor: '#2a2a40',
                            color: '#e2e2f0',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#e2a04a')}
                          onBlur={(e) => (e.target.style.borderColor = '#2a2a40')}
                        />
                      </div>
                    </div>
                  )}

                  {section.key === 'contact' && (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm" style={{ color: '#a0a0b8' }}>
                          客户姓名
                        </label>
                        <input
                          type="text"
                          value={form.customerName}
                          onChange={(e) => update('customerName', e.target.value)}
                          placeholder="请输入姓名"
                          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                          style={{
                            backgroundColor: '#0f0f1a',
                            borderColor: '#2a2a40',
                            color: '#e2e2f0',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#e2a04a')}
                          onBlur={(e) => (e.target.style.borderColor = '#2a2a40')}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm" style={{ color: '#a0a0b8' }}>
                          联系电话
                        </label>
                        <input
                          type="tel"
                          value={form.customerPhone}
                          onChange={(e) => update('customerPhone', e.target.value)}
                          placeholder="请输入手机号"
                          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                          style={{
                            backgroundColor: '#0f0f1a',
                            borderColor: '#2a2a40',
                            color: '#e2e2f0',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#e2a04a')}
                          onBlur={(e) => (e.target.style.borderColor = '#2a2a40')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300"
              style={{
                backgroundColor: isSubmitDisabled ? '#2a2a40' : '#e2a04a',
                color: isSubmitDisabled ? '#5a5a70' : '#0f0f1a',
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              提交咨询
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="w-1/3">
            <div
              className="sticky top-6 rounded-xl border p-5"
              style={{ backgroundColor: '#16162a', borderColor: '#2a2a40' }}
            >
              <h3
                className="mb-4 text-base font-semibold"
                style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: '#e2a04a' }}
              >
                <Calendar size={16} className="mb-0.5 mr-2 inline" />
                咨询摘要预览
              </h3>
              <div className="space-y-3">
                {[
                  { label: '客人数量', value: form.guestCount ? `${form.guestCount} 人` : '' },
                  { label: '年龄段', value: form.ageGroup ? AGE_GROUP_LABELS[form.ageGroup] : '' },
                  { label: '活动日期', value: formatDate(form.date) },
                  { label: '场次时间', value: form.timeSlot },
                  {
                    label: '包间需求',
                    value: form.needPrivateRoom
                      ? form.roomType
                        ? ROOM_TYPE_LABELS[form.roomType as RoomType]
                        : '需选择房型'
                      : '不需要',
                  },
                  {
                    label: '增值服务',
                    value: [
                      form.bringCake && '自带蛋糕',
                      form.bringAlcohol && '自带酒水',
                      form.needDMHost && 'DM主持',
                    ]
                      .filter(Boolean)
                      .join('、') || '无',
                  },
                  { label: '客户姓名', value: form.customerName },
                  { label: '联系电话', value: form.customerPhone },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span style={{ color: '#6a6a80' }}>{row.label}</span>
                    <span style={{ color: row.value ? '#d0d0e0' : '#3a3a50' }}>
                      {row.value || '未填写'}
                    </span>
                  </div>
                ))}
                {form.notes && (
                  <div className="pt-1">
                    <div className="mb-1 text-sm" style={{ color: '#6a6a80' }}>备注</div>
                    <div
                      className="rounded-lg p-2.5 text-xs leading-relaxed"
                      style={{ backgroundColor: '#0f0f1a', color: '#a0a0b8' }}
                    >
                      {form.notes}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="mt-5 h-px"
                style={{ backgroundColor: '#2a2a40' }}
              />
              <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: '#6a6a80' }}>
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isSubmitDisabled ? '#c84b31' : '#33b89a' }}
                />
                {isSubmitDisabled ? '请填写必填信息' : '信息已完整，可以提交'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
