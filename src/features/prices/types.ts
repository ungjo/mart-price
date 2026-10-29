export type BrandId = 'emart' | 'homeplus' | 'lotte' | 'everyday' | 'express';
export type ProductCategory = '유제품' | '라면' | '생수' | '간편식' | '커피';

export type Brand = { id: BrandId; name: string; color: string };

/** 용량과 묶음 수가 다르면 별도 상품 ID를 사용한다. 가격 비교는 이름이 아닌 ID로 연결한다. */
export type Product = {
  id: string;
  name: string;
  manufacturer: string;
  category: ProductCategory;
  sizeLabel: string;
  packCount: number;
  emoji: string;
  // 제조사 공식 제품 사진과 원문 출처를 함께 보관한다. 가격의 출처와는 별개다.
  image?: { uri: string; sourceUrl: string; note: string };
  keywords: string[];
};

export type Branch = {
  id: string;
  brandId: BrandId;
  name: string;
  district: string;
  area: string;
};

export type Offer = {
  id: string;
  productId: string;
  branchId: string;
  channel: 'offline' | 'online';
  kind: 'regular' | 'member' | 'card' | 'bundle';
  // null은 가격 미확인이다. 0원으로 바꾸면 최저가가 잘못 계산된다.
  payAmount: number | null;
  // 수량의 기준은 상품 한 묶음이다. 5개입 라면의 1+1은 두 묶음, 즉 낱개 10개를 받는다.
  payQuantity: number;
  receiveQuantity: number;
  condition: string;
  observedAt: string;
  startsAt?: string;
  endsAt?: string;
  source: { label: string; note: string };
  // 가격 관측만으로 실제 재고가 있다고 판단할 수 없다.
  stock: 'unknown';
};

export type OfferStatus = 'available' | 'unknown' | 'expired' | 'upcoming';
export type RegularComparison = {
  branch: Branch;
  offer: Offer | null;
  amount: number | null;
  isLowest: boolean;
};
