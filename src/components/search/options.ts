import type { CompanionType, StayType } from '@/lib/types';

/**
 * 条件選択の選択肢。
 * 数値の刻みをここに集約し、画面に散らさない。
 */

export const COMPANION_OPTIONS: readonly { value: CompanionType; label: string; icon: string }[] = [
  { value: 'solo', label: 'ひとり', icon: 'UserRound' },
  { value: 'couple', label: 'ふたり', icon: 'Users' },
  { value: 'friends', label: '友人と', icon: 'UsersRound' },
  { value: 'family', label: '家族と', icon: 'Baby' },
];

export const STAY_OPTIONS: readonly { value: StayType; label: string; icon: string }[] = [
  { value: 'day_trip', label: '日帰り', icon: 'Sun' },
  { value: 'lodging', label: '宿泊', icon: 'Moon' },
];

export const TRAVEL_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 60, label: '1時間以内' },
  { value: 90, label: '1時間30分以内' },
  { value: 120, label: '2時間以内' },
  { value: 180, label: '3時間以内' },
  { value: 240, label: '4時間以内' },
];

export const BUDGET_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 3000, label: '¥3,000まで' },
  { value: 5000, label: '¥5,000まで' },
  { value: 8000, label: '¥8,000まで' },
  { value: 12000, label: '¥12,000まで' },
  { value: 20000, label: '¥20,000まで' },
];
