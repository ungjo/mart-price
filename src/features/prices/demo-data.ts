import type { Brand, Branch, Offer } from './types';
import { products } from './product-catalog';

export { products } from './product-catalog';

/** 실제 판매 정보가 아닌 테스트 시나리오다. 날짜가 지나도 재현되도록 기준 시각을 고정한다. */
export const DEMO_AS_OF = '2026-10-29T12:00:00+09:00';

export const brands: Brand[] = [
  { id: 'emart', name: '이마트', color: '#936700' },
  { id: 'homeplus', name: '홈플러스', color: '#C52D3A' },
  { id: 'lotte', name: '롯데마트', color: '#BA2443' },
  { id: 'everyday', name: '이마트에브리데이', color: '#786000' },
  { id: 'express', name: '홈플러스 익스프레스', color: '#B12D32' },
];

// 지역명만 대전시를 사용하며, 지점명·가격·행사 모두 직접 만든 가상 정보다.
export const branches: Branch[] = [
  { id: 'emart-dunsan', brandId: 'emart', name: '둔산 예시점', district: '서구', area: '둔산동' },
  { id: 'emart-yuseong', brandId: 'emart', name: '유성 예시점', district: '유성구', area: '봉명동' },
  { id: 'homeplus-yuseong', brandId: 'homeplus', name: '유성 예시점', district: '유성구', area: '궁동' },
  { id: 'lotte-seogu', brandId: 'lotte', name: '서구 예시점', district: '서구', area: '관저동' },
  { id: 'everyday-daedeok', brandId: 'everyday', name: '대덕 예시점', district: '대덕구', area: '송촌동' },
  { id: 'express-donggu', brandId: 'express', name: '동구 예시점', district: '동구', area: '가오동' },
];



const demoSource = {
  label: '직접 만든 예시 데이터',
  note: '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.',
};

// 각 배열은 branches 순서다. 같은 브랜드의 서로 다른 지점 가격과 미확인 가격을 함께 시험한다.
const regularPrices: Record<string, (number | null)[]> = {
  'jin-mild-1': [850, 900, 880, 830, 950, null],
  'samyang-1': [950, 1000, 980, 930, 1050, 1080],
  'buldak-1': [1450, 1500, 1480, 1390, 1580, null],
  'carbo-buldak-1': [1680, 1750, 1690, 1650, null, 1800],
  'paldo-bibim-1': [1050, 1100, 1080, 990, 1180, 1200],
  'teumsae-1': [1180, 1250, 1200, 1150, 1290, null],
  'milk-1l': [2980, 3080, 2890, 2780, 3150, null],
  'ramyeon-5': [4480, 4580, 4380, 4480, null, 4780],
  'water-6': [6480, 6980, 6580, 6480, 7200, null],
  'rice-3': [3980, 4180, 4280, 4080, 4380, null],
  'coffee-20': [3580, 3680, null, 3480, 3880, 3980],
  'jin-ramyeon-5': [3480, 3580, 3380, 3480, null, 3780],
  'milk-1_8l': [5380, 5480, 5280, 5180, null, 5680],
  'ramyeon-1': [950, 1000, 980, 990, 1100, null],
};

const regularOffers: Offer[] = products.flatMap((product) =>
  branches.map((branch, index) => ({
    id: `${product.id}-${branch.id}-regular`,
    productId: product.id,
    branchId: branch.id,
    channel: 'offline' as const,
    kind: 'regular' as const,
    payAmount: regularPrices[product.id][index],
    payQuantity: 1,
    receiveQuantity: 1,
    condition: '회원가입·특정 카드·추가 구매 조건 없는 상품 한 묶음 가격',
    observedAt: '2026-10-29T10:00:00+09:00',
    source: demoSource,
    stock: 'unknown' as const,
  }))
);

function milkOffer(overrides: Partial<Offer> & Pick<Offer, 'id' | 'branchId'>): Offer {
  return {
    productId: 'milk-1l',
    channel: 'offline',
    kind: 'regular',
    payAmount: null,
    payQuantity: 1,
    receiveQuantity: 1,
    condition: '',
    observedAt: '2026-10-29T10:30:00+09:00',
    startsAt: '2026-10-26T00:00:00+09:00',
    endsAt: '2026-11-01T23:59:59+09:00',
    source: demoSource,
    stock: 'unknown',
    ...overrides,
  };
}

export const offers: Offer[] = [
  ...regularOffers,
  milkOffer({ id: 'milk-member', branchId: 'emart-dunsan', kind: 'member', payAmount: 2580, condition: '예시 멤버십 회원 인증 시 적용 · 다른 할인과 중복 불가' }),
  milkOffer({ id: 'milk-card', branchId: 'homeplus-yuseong', kind: 'card', payAmount: 2480, condition: '예시 행사 카드로 결제 시 적용 · 다른 할인과 중복 불가' }),
  milkOffer({ id: 'milk-bundle', branchId: 'everyday-daedeok', kind: 'bundle', payAmount: 3300, receiveQuantity: 2, condition: '1+1 예시 행사 · 1개 가격을 결제하고 같은 1L 상품 2개 수령' }),
  milkOffer({ id: 'milk-online', branchId: 'lotte-seogu', channel: 'online', payAmount: 2380, condition: '온라인 전용 예시 가격 · 배송비 별도, 매장 가격과 비교하지 않음' }),
  milkOffer({ id: 'milk-expired', branchId: 'express-donggu', kind: 'member', payAmount: 1980, condition: '종료된 예시 회원 행사 · 현재 적용 불가', startsAt: '2026-10-20T00:00:00+09:00', endsAt: '2026-10-27T23:59:59+09:00', observedAt: '2026-10-26T09:00:00+09:00' }),
];
