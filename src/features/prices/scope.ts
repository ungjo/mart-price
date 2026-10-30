import type { BrandId } from './types';

// 현재 연결은 대전 예시 데이터만 대상으로 한다. 실제 가격과 섞지 않도록 모든 조회에 같은 범위를 쓴다.
export const DEMO_AS_OF = '2026-10-29T12:00:00+09:00';
export const DATA_SCOPE = { isDemo: true, city: '대전광역시', asOf: DEMO_AS_OF } as const;
export const BRAND_IDS: readonly BrandId[] = ['emart', 'homeplus', 'lotte', 'everyday', 'express'];
