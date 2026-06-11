export type MealPeriod = 'lunch' | 'dinner'
export type LeftoverRatio = 'none' | 'little' | 'half' | 'most' | 'all'

export interface Restaurant {
  id: string
  name: string
  contact_name: string
  contact_phone: string
  created_at: string
}

export interface UserProfile {
  id: string
  restaurant_id: string
  role: 'owner' | 'staff'
  name: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  category: string
  is_active: boolean
  created_at: string
}

export interface LeftoverRecord {
  id: string
  restaurant_id: string
  menu_item_id: string
  menu_item?: MenuItem
  record_date: string
  meal_period: MealPeriod
  table_size: number
  leftover_ratio: LeftoverRatio
  reason_tags: string[]
  notes: string
  image_url?: string | null
  created_at: string
}

export interface AnalysisReport {
  id: string
  restaurant_id: string
  period_start: string
  period_end: string
  content: string
  created_at: string
}

export const LEFTOVER_RATIO_LABELS: Record<LeftoverRatio, string> = {
  none: '全部吃完',
  little: '少量剩余',
  half: '约半盘剩',
  most: '大部分剩',
  all: '几乎未动',
}

export const REASON_TAGS = [
  { value: 'too_spicy', label: '太辣' },
  { value: 'too_salty', label: '太咸' },
  { value: 'too_bland', label: '味道淡' },
  { value: 'too_much', label: '分量太多' },
  { value: 'texture', label: '口感问题' },
  { value: 'late_served', label: '上菜太晚' },
  { value: 'already_full', label: '客人已饱' },
  { value: 'not_expected', label: '不符期待' },
]
