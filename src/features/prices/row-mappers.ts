import { PriceDataError } from './data-error';
import type { BrandRow, BranchRow, PriceObservationRow, ProductRow } from './database-types';
import { BRAND_IDS } from './scope';
import type { Brand, BrandId, Branch, Offer, Product } from './types';

function brandId(value: string): BrandId {
  if (!BRAND_IDS.includes(value as BrandId)) throw new PriceDataError('지원하지 않는 마트 정보가 포함되어 있어요.');
  return value as BrandId;
}

export function mapBrand(row: BrandRow): Brand {
  return { id: brandId(row.id), name: row.name, color: row.color };
}

export function mapBranch(row: BranchRow): Branch {
  return { id: row.id, brandId: brandId(row.brand_id), name: row.name, city: row.city, district: row.district, area: row.area };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id, name: row.name, manufacturer: row.manufacturer, category: row.category,
    sizeLabel: row.size_label, packCount: row.pack_count, emoji: row.emoji,
    keywords: row.keywords.filter((keyword) => typeof keyword === 'string'),
    // 사진이 없을 때 가격 출처나 임의 사진을 대신 사용하지 않는다.
    image: row.image_url && row.image_source_url && row.image_note
      ? { uri: row.image_url, sourceUrl: row.image_source_url, note: row.image_note }
      : undefined,
  };
}

export function mapOffer(row: PriceObservationRow): Offer {
  if ((row.channel !== 'offline' && row.channel !== 'online')
    || !['regular', 'member', 'card', 'bundle'].includes(row.kind)
    || row.stock !== 'unknown' || row.currency !== 'KRW'
    || (row.channel === 'offline' && row.branch_id === null)) {
    throw new PriceDataError('가격 정보의 형식을 확인할 수 없어요.');
  }
  return {
    id: row.id, productId: row.product_id, brandId: brandId(row.brand_id), branchId: row.branch_id,
    channel: row.channel, kind: row.kind as Offer['kind'],
    // NULL을 0원으로 치환하지 않는다. 비정상 금액·수량의 비교 제외는 기존 규칙이 담당한다.
    payAmount: row.pay_amount, payQuantity: row.pay_quantity, receiveQuantity: row.receive_quantity,
    condition: row.condition, observedAt: row.observed_at, createdAt: row.created_at,
    startsAt: row.starts_at ?? undefined, endsAt: row.ends_at ?? undefined,
    source: { label: row.source_label, note: row.source_note, url: row.source_url ?? undefined },
    stock: 'unknown',
  };
}
