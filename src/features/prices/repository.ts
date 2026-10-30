import { PriceDataError } from './data-error';
import type { SupabaseClient } from '@supabase/supabase-js';

import { searchProducts } from './comparison';
import type { BrandRow, BranchRow, Database, PriceObservationRow, ProductRow } from './database-types';
import { mapBrand, mapBranch, mapOffer, mapProduct } from './row-mappers';
import { BRAND_IDS, DATA_SCOPE } from './scope';
import type { Brand, Branch, Offer, Product } from './types';

export type ComparisonData = { product: Product; brands: Brand[]; branches: Branch[]; offers: Offer[]; asOf: string };
export type PriceDetailData = ComparisonData & { offer: Offer };
type PageResult<Row> = { data: Row[] | null; error: { message: string; code?: string } | null };
const PAGE_SIZE = 200;

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error('취소된 요청입니다.');
    error.name = 'AbortError';
    throw error;
  }
}

async function readPages<Row>(
  read: (from: number, to: number) => PromiseLike<PageResult<Row>>,
  signal?: AbortSignal,
): Promise<Row[]> {
  const result: Row[] = [];
  for (;;) {
    checkAbort(signal);
    const response = await read(result.length, result.length + PAGE_SIZE - 1);
    checkAbort(signal);
    if (response.error) throw new PriceDataError('데이터를 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
    const rows = response.data ?? [];
    if (rows.length === 0) return result;
    result.push(...rows);
    // 서버의 최대 반환 행 수가 요청 크기보다 작아도 조기에 끝내지 않는다.
    // 안정적인 ID 순서로 실제 받은 행 수만큼 이동해 1,000행 이후 자료도 빠뜨리지 않는다.
  }
}

/** DB 조회를 분리해 네트워크 실패·페이지 이동·매핑을 화면과 독립적으로 검증한다. */
export function createPriceRepository(client: SupabaseClient<Database>) {
  async function searchCatalog(query: string, signal?: AbortSignal): Promise<Product[]> {
    if (!query.trim()) return [];
    // 현재 소규모 예시 카탈로그를 페이지 단위로 읽고 기존 한글/규격 검색 규칙을 재사용한다.
    // 실제 전체 마트 카탈로그로 확장할 때는 서버 검색·결과 페이지 처리를 추가한다.
    const rows = await readPages<ProductRow>((from, to) => {
      const request = client.from('products').select('*').eq('is_demo', DATA_SCOPE.isDemo)
        .order('id').range(from, to);
      return signal ? request.abortSignal(signal) : request;
    }, signal);
    return searchProducts(rows.filter((row) => row.is_demo === DATA_SCOPE.isDemo).map(mapProduct), query);
  }

  async function fetchProductComparison(productId: string, signal?: AbortSignal): Promise<ComparisonData | null> {
    checkAbort(signal);
    const productQuery = client.from('products').select('*').eq('id', productId)
      .eq('is_demo', DATA_SCOPE.isDemo);
    const productResult = await (signal ? productQuery.abortSignal(signal) : productQuery).maybeSingle();
    checkAbort(signal);
    if (productResult.error) throw new PriceDataError('상품 정보를 불러오지 못했어요. 다시 시도해 주세요.');
    if (!productResult.data || productResult.data.is_demo !== DATA_SCOPE.isDemo) return null;

    const [brandRows, branchRows, priceRows] = await Promise.all([
      readPages<BrandRow>((from, to) => {
        const request = client.from('brands').select('*').in('id', [...BRAND_IDS]).order('id').range(from, to);
        return signal ? request.abortSignal(signal) : request;
      }, signal),
      readPages<BranchRow>((from, to) => {
        const request = client.from('branches').select('*').eq('is_demo', DATA_SCOPE.isDemo)
          .eq('city', DATA_SCOPE.city).in('brand_id', [...BRAND_IDS]).order('id').range(from, to);
        return signal ? request.abortSignal(signal) : request;
      }, signal),
      readPages<PriceObservationRow>((from, to) => {
        const request = client.from('price_observations').select('*').eq('product_id', productId)
          .eq('is_demo', DATA_SCOPE.isDemo).in('brand_id', [...BRAND_IDS]).order('id').range(from, to);
        return signal ? request.abortSignal(signal) : request;
      }, signal),
    ]);
    checkAbort(signal);
    const brands = BRAND_IDS.map((id) => {
      const row = brandRows.find((item) => item.id === id);
      if (!row) throw new PriceDataError('마트 정보를 불러오지 못했어요. 다시 시도해 주세요.');
      return mapBrand(row);
    });
    const branches = branchRows.filter((row) => row.is_demo === DATA_SCOPE.isDemo && row.city === DATA_SCOPE.city).map(mapBranch);
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));
    const offers = priceRows.filter((row) => row.is_demo === DATA_SCOPE.isDemo && row.product_id === productId)
      .map(mapOffer).filter((offer) => {
        // 지역 밖 지점과 실제 가격은 제외한다. 지점이 없는 온라인 가격은 별도 조건으로 보여준다.
        if (offer.branchId === null) return offer.channel === 'online';
        return branchById.get(offer.branchId)?.brandId === offer.brandId;
      });
    return { product: mapProduct(productResult.data), brands, branches, offers, asOf: DATA_SCOPE.asOf };
  }

  async function fetchPriceDetail(offerId: string, signal?: AbortSignal): Promise<PriceDetailData | null> {
    checkAbort(signal);
    const query = client.from('price_observations').select('*').eq('id', offerId)
      .eq('is_demo', DATA_SCOPE.isDemo).in('brand_id', [...BRAND_IDS]);
    const result = await (signal ? query.abortSignal(signal) : query).maybeSingle();
    checkAbort(signal);
    if (result.error) throw new PriceDataError('가격 정보를 불러오지 못했어요. 다시 시도해 주세요.');
    if (!result.data || result.data.is_demo !== DATA_SCOPE.isDemo) return null;
    const comparison = await fetchProductComparison(result.data.product_id, signal);
    if (!comparison) return null;
    const offer = comparison.offers.find((item) => item.id === offerId);
    // 상세 주소로 들어와도 비교 화면과 같은 지역·예시 범위를 적용한다.
    return offer ? { ...comparison, offer } : null;
  }

  return { searchCatalog, fetchProductComparison, fetchPriceDetail };
}

async function liveRepository() {
  // 테스트용 주입 저장소는 Expo 환경변수나 네이티브 URL polyfill 없이 검증할 수 있다.
  const { getSupabaseClient } = await import('../../lib/supabase');
  return createPriceRepository(getSupabaseClient());
}

export async function searchCatalog(query: string, signal?: AbortSignal): Promise<Product[]> {
  return (await liveRepository()).searchCatalog(query, signal);
}
export async function fetchProductComparison(productId: string, signal?: AbortSignal): Promise<ComparisonData | null> {
  return (await liveRepository()).fetchProductComparison(productId, signal);
}
export async function fetchPriceDetail(offerId: string, signal?: AbortSignal): Promise<PriceDetailData | null> {
  return (await liveRepository()).fetchPriceDetail(offerId, signal);
}
