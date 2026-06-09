import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function leftoverRatioToNumber(ratio: string): number {
  const map: Record<string, number> = {
    none: 0,
    little: 0.2,
    half: 0.5,
    most: 0.8,
    all: 1,
  }
  return map[ratio] ?? 0
}
