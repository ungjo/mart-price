import type { SupabaseClient } from '@supabase/supabase-js';

import { PriceDataError } from '../prices/data-error';
import type { BrandRow, BranchRow, Database } from '../prices/database-types';
import { mapBrand, mapBranch } from '../prices/row-mappers';
import { BRAND_IDS, DATA_SCOPE } from '../prices/scope';
import type { Brand, Branch } from '../prices/types';

export type BranchCatalog = { brands: Brand[]; branches: Branch[] };
type PageResult<Row> = { data: Row[] | null; error: { message: string } | null };
const PAGE_SIZE = 200;

function checkAbort(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  const error = new Error('취소된 요청입니다.');
  error.name = 'AbortError';
  throw error;
}

async function readPages<Row>(
  read: (from: number, to: number) => PromiseLike<PageResult<Row>>,
  signal?: AbortSignal,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (;;) {
    checkAbort(signal);
    const result = await read(rows.length, rows.length + PAGE_SIZE - 1);
    checkAbort(signal);
    if (result.error) throw new PriceDataError('지점 목록을 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
    const page = result.data ?? [];
    if (page.length === 0) return rows;
    // 서버의 반환 한도가 더 작아도 실제 받은 행 수만큼 이어 읽어 지점이 누락되지 않게 한다.
    rows.push(...page);
  }
}

/** 상품을 먼저 고르지 않아도 비교할 지점을 선택할 수 있도록 지점 목록을 별도로 조회한다. */
export function createBranchRepository(client: SupabaseClient<Database>) {
  async function fetchBranchCatalog(signal?: AbortSignal): Promise<BranchCatalog> {
    checkAbort(signal);
    const [brandRows, branchRows] = await Promise.all([
      readPages<BrandRow>((from, to) => {
        const request = client.from('brands').select('*').in('id', [...BRAND_IDS]).order('id').range(from, to);
        return signal ? request.abortSignal(signal) : request;
      }, signal),
      readPages<BranchRow>((from, to) => {
        const request = client.from('branches').select('*').eq('is_demo', DATA_SCOPE.isDemo)
          .eq('city', DATA_SCOPE.city).in('brand_id', [...BRAND_IDS]).order('id').range(from, to);
        return signal ? request.abortSignal(signal) : request;
      }, signal),
    ]);
    checkAbort(signal);
    const brands = BRAND_IDS.map((id) => {
      const row = brandRows.find((item) => item.id === id);
      if (!row) throw new PriceDataError('마트 정보를 불러오지 못했어요. 다시 시도해 주세요.');
      return mapBrand(row);
    });
    // 실제 매장과 다른 도시를 선택 화면에 섞지 않는다. 조회 실패 시 로컬 예시로 대체하지 않는다.
    const branches = branchRows.filter((row) => row.is_demo === DATA_SCOPE.isDemo && row.city === DATA_SCOPE.city
      && BRAND_IDS.some((id) => id === row.brand_id)).map(mapBranch);
    return { brands, branches };
  }
  return { fetchBranchCatalog };
}

export async function fetchBranchCatalog(signal?: AbortSignal): Promise<BranchCatalog> {
  const { getSupabaseClient } = await import('../../lib/supabase');
  return createBranchRepository(getSupabaseClient()).fetchBranchCatalog(signal);
}
