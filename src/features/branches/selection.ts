import { DATA_SCOPE } from '../prices/scope';
import type { Branch } from '../prices/types';

export const DAEJEON_DISTRICTS = ['동구', '중구', '서구', '유성구', '대덕구'] as const;

export type BranchSelection = {
  version: 1;
  city: '대전광역시';
  // 구는 지점을 찾는 목록 필터다. 다른 구에서 이미 선택한 지점은 비교에서 제외하지 않는다.
  district: string | null;
  // null은 전체 지점, []는 사용자가 모든 지점을 해제한 상태다. 둘을 같은 값으로 취급하지 않는다.
  branchIds: string[] | null;
};

export const DEFAULT_SELECTION: BranchSelection = {
  version: 1, city: DATA_SCOPE.city, district: null, branchIds: null,
};

function validateSelection(value: unknown): BranchSelection {
  const invalid = () => new Error('저장된 지점 선택의 형식을 확인할 수 없어요. 선택을 초기화해 주세요.');
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid();
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 || candidate.city !== DATA_SCOPE.city
    || (candidate.district !== null && !DAEJEON_DISTRICTS.some((district) => district === candidate.district))
    || (candidate.branchIds !== null && (!Array.isArray(candidate.branchIds)
      || !candidate.branchIds.every((id) => typeof id === 'string' && id.trim().length > 0)))) {
    throw invalid();
  }
  return {
    version: 1,
    city: DATA_SCOPE.city,
    district: candidate.district as string | null,
    branchIds: candidate.branchIds === null ? null : [...new Set(candidate.branchIds as string[])],
  };
}

/** 저장 버전과 필드 형식을 확인한다. 손상된 저장값을 전체 지점 선택으로 조용히 바꾸지 않는다. */
export function parseSelection(raw: string | null): BranchSelection {
  if (raw === null) return { ...DEFAULT_SELECTION };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('저장된 지점 선택을 읽을 수 없어요. 선택을 초기화해 주세요.');
  }
  return validateSelection(value);
}

export function serializeSelection(selection: BranchSelection): string {
  return JSON.stringify(validateSelection(selection));
}

/** 최신 DB 목록과 저장한 ID의 교집합만 비교한다. 지점이 삭제되어도 다른 지점을 자동 선택하지 않는다. */
export function selectBranches(branches: readonly Branch[], selection: BranchSelection): Branch[] {
  const ids = selection.branchIds === null ? null : new Set(selection.branchIds);
  return branches.filter((branch) => branch.city === selection.city && (ids === null || ids.has(branch.id)));
}

export function getMissingBranchIds(branches: readonly Branch[], selection: BranchSelection): string[] {
  if (selection.branchIds === null) return [];
  const available = new Set(branches.filter((branch) => branch.city === selection.city).map((branch) => branch.id));
  return [...new Set(selection.branchIds)].filter((id) => !available.has(id));
}
