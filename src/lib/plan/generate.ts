import { GoogleGenAI, Type } from '@google/genai';

import { buildPrompt } from './prompt';

import type { PlanCandidates } from './candidates';
import type { PlanUserContext } from './prompt';
import type { PlanOutput } from '@/lib/types';

/** Gemini に使用するモデル。Free Tier で利用可能 */
const MODEL = 'gemini-3.6-flash';

/**
 * PlanOutput の JSON Schema。
 * Gemini の responseJsonSchema で構造化出力を強制する。
 */
const PLAN_OUTPUT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'プランの概要を表す一言（20文字以内）。施設名を含めず体験の魅力を伝える',
    },
    items: {
      type: Type.ARRAY,
      description: 'プランの項目一覧。時系列順に並べる',
      items: {
        type: Type.OBJECT,
        properties: {
          startTime: {
            type: Type.STRING,
            description: 'HH:mm 形式の開始時刻',
          },
          refType: {
            type: Type.STRING,
            description: '施設の種類: sauna, restaurant, spot, hotel のいずれか',
          },
          refId: {
            type: Type.STRING,
            description: '候補リストに含まれる施設ID',
          },
          note: {
            type: Type.STRING,
            description: '短い一言コメント（15文字以内）。不要なら空文字',
          },
        },
        propertyOrdering: ['startTime', 'refType', 'refId', 'note'],
      },
    },
  },
  propertyOrdering: ['title', 'items'],
} as const;

/**
 * Gemini API を呼び出して休日プランを生成する。
 *
 * IMPORTANT:
 * - API キーが未設定、またはリクエスト失敗時は null を返す
 * - 呼び出し元で null の場合は決定的 buildPlan にフォールバックする
 * - 生成結果は validatePlan() で検証してから使う
 */
export async function generatePlan(
  candidates: PlanCandidates,
  context: PlanUserContext,
): Promise<PlanOutput | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[plan/generate] GEMINI_API_KEY が未設定。決定的プランにフォールバックします');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { system, user } = buildPrompt(candidates, context);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseJsonSchema: PLAN_OUTPUT_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      console.warn('[plan/generate] Gemini から空のレスポンス');
      return null;
    }

    const parsed = JSON.parse(text) as PlanOutput;

    // 基本的な形状チェック
    if (!Array.isArray(parsed.items)) {
      console.warn('[plan/generate] 不正な出力形式: items が配列でない');
      return null;
    }

    // note の空文字を null に正規化
    const normalized: PlanOutput = {
      title: parsed.title && parsed.title.trim() !== '' ? parsed.title.trim() : '',
      items: parsed.items.map((item) => ({
        startTime: item.startTime || null,
        refType: item.refType,
        refId: item.refId,
        note: item.note && item.note.trim() !== '' ? item.note.trim() : null,
      })),
    };

    return normalized;
  } catch (error) {
    console.error('[plan/generate] プラン生成に失敗:', error instanceof Error ? error.message : error);
    return null;
  }
}
