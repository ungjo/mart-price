const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const buildRoot = process.env.PRICES_TEST_BUILD;
if (!buildRoot) throw new Error('npm test 또는 node scripts/test-prices.cjs로 실행하세요.');
const { brands, branches, products, offers, DEMO_AS_OF } = require(path.join(buildRoot, 'demo-data.js'));
const {
  buildRegularComparisons, searchProducts: searchProductList, getOfferStatus,
  getEffectiveUnitPrice, formatWon, formatDateTime,
} = require(path.join(buildRoot, 'comparison.js'));

// 예시 배열은 테스트에서만 주입한다. 앱의 실제 조회 모듈이 로컬 예시로 돌아가지 않게 분리한다.
const searchProducts = (query, category) => searchProductList(products, query, category);
const getProduct = id => products.find(product => product.id === id);
const getOffer = id => offers.find(item => item.id === id);
const getRegularComparisons = (productId, brandId) => getProduct(productId)
  ? buildRegularComparisons(productId, branches, offers, DEMO_AS_OF, brandId) : [];
const getLowestPrice = productId => getRegularComparisons(productId).find(row => row.amount !== null)?.amount ?? null;

const base = offers.find((offer) => offer.id === 'milk-1l-emart-dunsan-regular');
const observedEarlier = '2026-10-28T10:00:00+09:00';
const observedLater = '2026-10-29T11:00:00+09:00';

function offer(overrides = {}) {
  return { ...base, ...overrides };
}

test('예시 데이터는 다섯 브랜드, 여섯 지점, 규격별 상품 카탈로그를 연결한다', () => {
  assert.equal(brands.length, 5);
  assert.equal(branches.length, 6);
  assert.ok(products.length >= 14);
  assert.equal(new Set(offers.map((item) => item.id)).size, offers.length);
  for (const item of offers) {
    assert.ok(products.some((product) => product.id === item.productId));
    assert.ok(branches.some((branch) => branch.id === item.branchId));
    assert.equal(item.source.label, '직접 만든 예시 데이터');
    assert.equal(item.stock, 'unknown');
  }
  assert.ok(branches.every((branch) => branch.name.includes('예시점')));
});

test('검색은 공백, 대소문자, 전각 문자와 여러 조건을 처리하고 규격을 구분한다', () => {
  assert.deepEqual(searchProducts(' 서울우유 １ｌ ').map((item) => item.id), ['milk-1l']);
  assert.deepEqual(searchProducts('농심 신라면 5개').map((item) => item.id), ['ramyeon-5']);
  assert.deepEqual(searchProducts('신라면 1개').map((item) => item.id), ['ramyeon-1']);
  assert.deepEqual(searchProducts('우유', '라면'), []);
  assert.equal(searchProducts('   ').length, products.length);
  assert.deepEqual(searchProducts('없는상품'), []);
});

test('매장 일반 가격만 순위를 매기며 미확인 지점은 마지막에 표시한다', () => {
  const rows = getRegularComparisons('milk-1l');
  assert.equal(rows.length, 6);
  assert.equal(rows[0].amount, 2780);
  assert.equal(rows[0].branch.id, 'lotte-seogu');
  assert.equal(rows[0].isLowest, true);
  assert.equal(rows.at(-1).branch.id, 'express-donggu');
  assert.equal(rows.at(-1).amount, null);
  assert.equal(rows.at(-1).isLowest, false);
  assert.equal(getLowestPrice('milk-1l'), 2780);
  assert.equal(getLowestPrice('존재하지-않는-id'), null);
});

test('더 싼 온라인·회원·카드·묶음 가격과 다른 상품 규격을 최저가에 섞지 않는다', () => {
  const candidates = [
    offer({ id: 'regular', payAmount: 3000 }),
    offer({ id: 'online', channel: 'online', payAmount: 1 }),
    offer({ id: 'member', kind: 'member', payAmount: 2 }),
    offer({ id: 'card', kind: 'card', payAmount: 3 }),
    offer({ id: 'bundle', kind: 'bundle', payAmount: 4, receiveQuantity: 2 }),
    offer({ id: 'different-size', productId: 'milk-1_8l', payAmount: 5 }),
    offer({ id: 'different-pack', productId: 'ramyeon-1', payAmount: 6 }),
  ];
  const rows = buildRegularComparisons('milk-1l', [branches[0]], candidates);
  assert.equal(rows[0].amount, 3000);
  assert.equal(rows[0].offer.id, 'regular');
});

test('브랜드 필터 적용 범위 안에서 최저가를 다시 계산한다', () => {
  const rows = getRegularComparisons('milk-1l', 'emart');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].amount, 2980);
  assert.equal(rows[0].isLowest, true);
  assert.equal(rows[1].isLowest, false);
});

test('동률 최저가 모두 표시하고 알려진 가격이 없으면 최저가를 만들지 않는다', () => {
  const rows = getRegularComparisons('water-6');
  assert.equal(rows.filter((row) => row.isLowest).length, 2);
  const unknownRows = buildRegularComparisons('milk-1l', branches, [offer({ payAmount: null })]);
  assert.ok(unknownRows.every((row) => row.amount === null && !row.isLowest));
  assert.equal(unknownRows.length, branches.length);
});

test('0원·음수·비정상 숫자·미확인 가격과 잘못된 수량은 순위에서 제외한다', () => {
  for (const payAmount of [null, 0, -1, NaN, Infinity]) {
    const item = offer({ payAmount });
    assert.equal(getOfferStatus(item), 'unknown');
    assert.equal(getEffectiveUnitPrice(item), null);
    assert.equal(buildRegularComparisons('milk-1l', [branches[0]], [item])[0].amount, null);
  }
  for (const quantities of [{ payQuantity: 0 }, { receiveQuantity: 0 }, { receiveQuantity: 1.5 }, { payQuantity: 2, receiveQuantity: 1 }]) {
    assert.equal(getOfferStatus(offer(quantities)), 'unknown');
  }
  assert.equal(buildRegularComparisons('milk-1l', [branches[0]], [offer({ payQuantity: 2, receiveQuantity: 2 })])[0].amount, null);
});

test('종료·시작 전·잘못된 날짜·미래 관측은 배제하고 행사 종료 시각은 포함한다', () => {
  const cases = [
    [offer({ endsAt: '2026-10-29T11:59:59+09:00' }), 'expired'],
    [offer({ startsAt: '2026-10-29T12:00:01+09:00' }), 'upcoming'],
    [offer({ endsAt: 'not-a-date' }), 'unknown'],
    [offer({ startsAt: '2026-11-01', endsAt: '2026-10-01' }), 'unknown'],
    [offer({ observedAt: 'not-a-date' }), 'unknown'],
    [offer({ observedAt: '2026-10-30T10:00:00+09:00' }), 'unknown'],
  ];
  for (const [item, expected] of cases) {
    assert.equal(getOfferStatus(item), expected);
    assert.equal(buildRegularComparisons('milk-1l', [branches[0]], [item])[0].amount, null);
  }
  assert.equal(getOfferStatus(offer({ endsAt: DEMO_AS_OF })), 'available');
  assert.equal(getOfferStatus(offer({ startsAt: DEMO_AS_OF })), 'available');
  assert.equal(getOfferStatus(base, 'bad-date'), 'unknown');
  assert.equal(getOfferStatus(getOffer('milk-expired')), 'expired');
});

test('새로운 미확인·종료 기록이 있으면 오래된 가격으로 되돌아가지 않는다', () => {
  for (const newer of [
    offer({ id: 'newer-unknown', observedAt: observedLater, payAmount: null }),
    offer({ id: 'newer-expired', observedAt: observedLater, endsAt: '2026-10-29T11:30:00+09:00' }),
  ]) {
    const older = offer({ id: 'older', observedAt: observedEarlier, payAmount: 1000 });
    for (const records of [[older, newer], [newer, older]]) {
      const row = buildRegularComparisons('milk-1l', [branches[0]], records)[0];
      assert.equal(row.amount, null);
      assert.equal(row.offer.id, newer.id);
    }
  }
});

test('같은 지점의 최신 관측 가격을 선택하고 입력 배열을 변경하지 않는다', () => {
  const records = [
    offer({ id: 'older', observedAt: observedEarlier, payAmount: 1000 }),
    offer({ id: 'newer', observedAt: observedLater, payAmount: 3200 }),
  ];
  const before = JSON.stringify(records);
  assert.equal(buildRegularComparisons('milk-1l', [branches[0]], records)[0].amount, 3200);
  assert.equal(JSON.stringify(records), before);
});

test('같은 확인 시각의 DB 가격은 저장 시각과 ID로 결정해 응답 순서에 흔들리지 않는다', () => {
  const olderSaved = offer({ id: 'z-old', createdAt: '2026-10-29T01:00:00Z', payAmount: 1000 });
  const newerSaved = offer({ id: 'a-new', createdAt: '2026-10-29T02:00:00Z', payAmount: 3200 });
  const sameTimeLaterId = offer({ ...newerSaved, id: 'z-new', payAmount: null });
  for (const records of [[olderSaved, newerSaved], [newerSaved, olderSaved]]) {
    assert.equal(buildRegularComparisons('milk-1l', [branches[0]], records)[0].offer.id, 'a-new');
  }
  for (const records of [[newerSaved, sameTimeLaterId], [sameTimeLaterId, newerSaved]]) {
    const row = buildRegularComparisons('milk-1l', [branches[0]], records)[0];
    assert.equal(row.offer.id, 'z-new');
    assert.equal(row.amount, null);
  }
});

test('1+1은 결제 금액과 수령 수량을 보존하고 환산가를 별도로 계산한다', () => {
  const bundle = getOffer('milk-bundle');
  assert.equal(bundle.payAmount, 3300);
  assert.equal(bundle.payQuantity, 1);
  assert.equal(bundle.receiveQuantity, 2);
  assert.equal(getEffectiveUnitPrice(bundle), 1650);
  assert.equal(getProduct(bundle.productId).packCount, 1);
  assert.equal(getLowestPrice(bundle.productId), 2780);
});

test('원화와 확인 시각은 한국 표기로 출력하고 날짜는 한국 시간대를 사용한다', () => {
  assert.equal(formatWon(2780), '2,780원');
  const date = formatDateTime('2026-10-28T15:30:00Z');
  assert.match(date, /2026/);
  assert.match(date, /29/);
  assert.match(date, /00:30/);
  assert.equal(formatDateTime('bad-date'), '날짜 미확인');
});

test('라면 품목명 검색은 여러 제조사의 사진 있는 상품을 반환한다', () => {
  const found = searchProducts('라면');
  assert.ok(found.length >= 9);
  assert.deepEqual([...new Set(found.map(item => item.manufacturer))].sort(), ['농심', '삼양식품', '오뚜기', '팔도'].sort());
  assert.ok(found.every(item => item.image?.uri.startsWith('https://') && item.image.sourceUrl.startsWith('https://')));
  assert.deepEqual(searchProducts('삼양 불닭 140g').map(item => item.id), ['buldak-1']);
});
