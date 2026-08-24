'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { EMPTY_CONDITIONS, isSameTag, nextTagLevel } from '@/lib/types';

import { saveConditions } from './guest-storage';

import type {
  CompanionType,
  RequiredConditions,
  SearchConditions,
  StayType,
  TagLevel,
  TagRef,
} from '@/lib/types';
import type { ReactNode } from 'react';

type Action =
  | { type: 'setRequired'; patch: Partial<RequiredConditions> }
  | { type: 'setTagLevel'; tag: TagRef; level: TagLevel }
  | { type: 'replace'; conditions: SearchConditions }
  | { type: 'reset' };

function without(tags: TagRef[], tag: TagRef): TagRef[] {
  return tags.filter((ref) => !isSameTag(ref, tag));
}

/**
 * タグの強さを設定する。
 *
 * IMPORTANT: 同じタグが wish と must の両方に入らないよう、
 * 必ず両方から取り除いてから入れ直す。
 */
function applyTagLevel(state: SearchConditions, tag: TagRef, level: TagLevel): SearchConditions {
  const wishTags = without(state.wish.tags, tag);
  const absoluteTags = without(state.required.absoluteTags, tag);

  return {
    required: {
      ...state.required,
      absoluteTags: level === 'must' ? [...absoluteTags, tag] : absoluteTags,
    },
    wish: { tags: level === 'wish' ? [...wishTags, tag] : wishTags },
  };
}

function reducer(state: SearchConditions, action: Action): SearchConditions {
  switch (action.type) {
    case 'setRequired':
      return { ...state, required: { ...state.required, ...action.patch } };
    case 'setTagLevel':
      return applyTagLevel(state, action.tag, action.level);
    case 'replace':
      return action.conditions;
    case 'reset':
      return EMPTY_CONDITIONS;
  }
}

type ConditionsApi = {
  conditions: SearchConditions;
  setRequired: (patch: Partial<RequiredConditions>) => void;
  setDate: (date: string | null) => void;
  setPartySize: (size: number | null) => void;
  setCompanion: (companion: CompanionType | null) => void;
  setOrigin: (originKey: string | null) => void;
  setTravelMinutes: (minutes: number | null) => void;
  setStayType: (stayType: StayType | null) => void;
  setBudget: (budget: number | null) => void;
  /** タグの現在の強さ */
  levelOf: (tag: TagRef) => TagLevel;
  /** 未選択 → 希望 → 必須 → 未選択 と進める */
  cycleTag: (tag: TagRef) => void;
  setTagLevel: (tag: TagRef, level: TagLevel) => void;
  /** 必須に指定しているタグ */
  mustTags: TagRef[];
  /** 希望に指定しているタグ */
  wishTags: TagRef[];
  reset: () => void;
};

const ConditionsContext = createContext<ConditionsApi | null>(null);

/**
 * 検索条件の保持。
 *
 * ホーム → 条件設定 → 検索結果 で引き継ぐ。
 * 変更のたびに端末側へ保存し、ゲストでも失われないようにする（要件2-9）。
 */
export function ConditionsProvider({
  children,
  initial = EMPTY_CONDITIONS,
}: {
  children: ReactNode;
  initial?: SearchConditions;
}) {
  const [conditions, dispatch] = useReducer(reducer, initial);

  // 端末側へ保存する。URL への反映は遷移時に行う
  useEffect(() => {
    saveConditions(conditions);
  }, [conditions]);

  const setRequired = useCallback((patch: Partial<RequiredConditions>) => {
    dispatch({ type: 'setRequired', patch });
  }, []);

  const levelOf = useCallback(
    (tag: TagRef): TagLevel => {
      if (conditions.required.absoluteTags.some((ref) => isSameTag(ref, tag))) return 'must';
      if (conditions.wish.tags.some((ref) => isSameTag(ref, tag))) return 'wish';
      return 'none';
    },
    [conditions],
  );

  const api = useMemo<ConditionsApi>(
    () => ({
      conditions,
      setRequired,
      setDate: (date) => setRequired({ date }),
      setPartySize: (partySize) => setRequired({ partySize }),
      setCompanion: (companion) => setRequired({ companion }),
      setOrigin: (originKey) => setRequired({ originKey }),
      setTravelMinutes: (maxTravelMinutes) => setRequired({ maxTravelMinutes }),
      setStayType: (stayType) => setRequired({ stayType }),
      setBudget: (budgetMax) => setRequired({ budgetMax }),
      levelOf,
      cycleTag: (tag) =>
        dispatch({ type: 'setTagLevel', tag, level: nextTagLevel(levelOf(tag)) }),
      setTagLevel: (tag, level) => dispatch({ type: 'setTagLevel', tag, level }),
      mustTags: conditions.required.absoluteTags,
      wishTags: conditions.wish.tags,
      reset: () => dispatch({ type: 'reset' }),
    }),
    [conditions, setRequired, levelOf],
  );

  return <ConditionsContext.Provider value={api}>{children}</ConditionsContext.Provider>;
}

export function useConditions(): ConditionsApi {
  const value = useContext(ConditionsContext);
  if (value === null) {
    throw new Error('useConditions は ConditionsProvider の内側で使ってください');
  }
  return value;
}
