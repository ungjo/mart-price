import { brands, branches, DEMO_AS_OF, offers, products } from './demo-data';
import type { Brand, BrandId, Branch, Offer, OfferStatus, RegularComparison } from './types';

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
}

export function searchProducts(query: string, category?: string) {
  const terms = query.normalize('NFKC').trim().split(/\s+/).map(normalize).filter(Boolean);
  return products.filter((product) => {
    if (category && category !== '전체' && product.category !== category) return false;
    const searchable = normalize([
      product.name, product.manufacturer, product.category, product.sizeLabel,
      `${product.packCount}개`, `${product.packCount}입`, ...product.keywords,
    ].join(' '));
    // 여러 검색어를 모두 만족하는 정확한 규격을 찾되, 실제 가격 비교는 상품 ID로만 한다.
    return terms.every((term) => searchable.includes(term));
  });
}

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getBranch(id: string) {
  return branches.find((branch) => branch.id === id);
}

export function getBrand(id: BrandId): Brand {
  const brand = brands.find((item) => item.id === id);
  if (!brand) throw new Error(`등록되지 않은 브랜드입니다: ${id}`);
  return brand;
}

export function getOffer(id: string) {
  return offers.find((offer) => offer.id === id);
}

export function getProductOffers(productId: string): Offer[] {
  return offers.filter((offer) => offer.productId === productId);
}

function hasValidAmounts(offer: Offer): boolean {
  return offer.payAmount !== null && Number.isFinite(offer.payAmount) && offer.payAmount > 0
    && Number.isInteger(offer.payQuantity) && offer.payQuantity > 0
    && Number.isInteger(offer.receiveQuantity) && offer.receiveQuantity >= offer.payQuantity;
}

export function getOfferStatus(offer: Offer, asOf: string = DEMO_AS_OF): OfferStatus {
  const now = Date.parse(asOf);
  const observed = Date.parse(offer.observedAt);
  const start = offer.startsAt === undefined ? -Infinity : Date.parse(offer.startsAt);
  const end = offer.endsAt === undefined ? Infinity : Date.parse(offer.endsAt);
  // 잘못된 날짜·수량·가격은 최저가 후보로 쓰지 않는다. 가격 기록은 재고 보장을 뜻하지 않는다.
  if (!Number.isFinite(now) || !Number.isFinite(observed) || observed > now
    || Number.isNaN(start) || Number.isNaN(end) || start > end || !hasValidAmounts(offer)) {
    return 'unknown';
  }
  if (end < now) return 'expired';
  if (start > now) return 'upcoming';
  return 'available';
}

/**
 * 동일 상품의 매장 일반 가격만 순위를 매긴다. 조건부·온라인·묶음 수량의 가격은 섞지 않는다.
 * 최신 기록이 미확인이거나 종료됐을 때도 오래된 싼 가격으로 되돌아가지 않도록 먼저 최신 기록을 고른다.
 */
export function buildRegularComparisons(
  productId: string,
  branchList: readonly Branch[],
  offerList: readonly Offer[],
  asOf: string = DEMO_AS_OF,
  brandId?: BrandId,
): RegularComparison[] {
  const rows = branchList.filter((branch) => !brandId || branch.brandId === brandId).map((branch) => {
    const candidates = offerList.filter((offer) => offer.productId === productId
      && offer.branchId === branch.id && offer.channel === 'offline' && offer.kind === 'regular');
    const offer = candidates.reduce<Offer | null>((latest, candidate) => {
      if (!latest) return candidate;
      const previousTime = Date.parse(latest.observedAt);
      const candidateTime = Date.parse(candidate.observedAt);
      // 날짜가 손상된 최신 입력을 무시하고 이전 가격을 노출하지 않도록 보수적으로 미확인 처리한다.
      if (!Number.isFinite(previousTime)) return latest;
      if (!Number.isFinite(candidateTime) || candidateTime >= previousTime) return candidate;
      return latest;
    }, null);
    const eligible = offer && offer.payQuantity === 1 && offer.receiveQuantity === 1
      && getOfferStatus(offer, asOf) === 'available';
    return { branch, offer, amount: eligible ? offer.payAmount : null, isLowest: false };
  });
  const known = rows.flatMap((row) => row.amount === null ? [] : [row.amount]);
  const lowest = known.length ? Math.min(...known) : null;
  return rows.map((row) => ({ ...row, isLowest: row.amount !== null && row.amount === lowest }))
    .sort((left, right) => {
      if (left.amount === null && right.amount !== null) return 1;
      if (left.amount !== null && right.amount === null) return -1;
      if (left.amount !== null && right.amount !== null && left.amount !== right.amount) {
        return left.amount - right.amount;
      }
      return left.branch.id.localeCompare(right.branch.id);
    });
}

export function getRegularComparisons(productId: string, brandId?: BrandId): RegularComparison[] {
  if (!getProduct(productId)) return [];
  return buildRegularComparisons(productId, branches, offers, DEMO_AS_OF, brandId);
}

export function getLowestPrice(productId: string): number | null {
  return getRegularComparisons(productId).find((row) => row.amount !== null)?.amount ?? null;
}

/** 환산가는 비교를 돕는 참고값이다. 1+1의 실제 결제액은 payAmount 그대로 표시해야 한다. */
export function getEffectiveUnitPrice(offer: Offer): number | null {
  return hasValidAmounts(offer) ? offer.payAmount! / offer.receiveQuantity : null;
}

export function formatWon(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

export function formatDateTime(value: string): string {
  if (!Number.isFinite(Date.parse(value))) return '날짜 미확인';
  // 실행 기기의 시간대와 관계없이 대전 매장의 확인 시각을 한국 시간으로 일치시킨다.
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}
