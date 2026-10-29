import { getRegularComparisons } from './comparison';
import { brands } from './demo-data';
import type { Brand } from './types';

export type BrandPriceSummary = {
  brand: Brand;
  lowestAmount: number | null;
  branchCount: number;
  knownBranchCount: number;
  cheapestBranchName: string | null;
};

/**
 * 마트별 대표 숫자는 조회 범위 내 지점의 최저 일반가다. 전국 공통 가격을 뜻하지 않는다.
 * 지점 비교 결과를 재사용해 회원가·온라인가·만료 가격이 요약에 섞이지 않게 한다.
 */
export function getBrandSummaries(productId: string): BrandPriceSummary[] {
  const comparisons = getRegularComparisons(productId);
  // 가격이 없는 마트도 반드시 남긴다. 미확인은 미판매나 0원이라는 뜻이 아니다.
  return brands.map((brand) => {
    const rows = comparisons.filter((row) => row.branch.brandId === brand.id);
    const knownRows = rows.filter((row) => row.amount !== null);
    const cheapest = knownRows[0];
    return {
      brand,
      lowestAmount: cheapest?.amount ?? null,
      branchCount: rows.length,
      knownBranchCount: knownRows.length,
      cheapestBranchName: cheapest?.branch.name ?? null,
    };
  });
}
