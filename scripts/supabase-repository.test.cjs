const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const buildRoot = process.env.PRICES_TEST_BUILD;
if (!buildRoot) throw new Error('npm test로 실행하세요.');
const { createPriceRepository } = require(path.join(buildRoot, 'repository.js'));
const { mapBrand, mapBranch, mapProduct, mapOffer } = require(path.join(buildRoot, 'row-mappers.js'));
const { buildRegularComparisons, getOfferStatus } = require(path.join(buildRoot, 'comparison.js'));
const { brands, branches, products, offers, DEMO_AS_OF } = require(path.join(buildRoot, 'demo-data.js'));

const createdAt = '2026-10-29T00:00:00Z';
const rawBrand = b => ({ id: b.id, name: b.name, color: b.color, created_at: createdAt });
const rawBranch = b => ({
  id: b.id, brand_id: b.brandId, name: b.name, city: '대전광역시', district: b.district,
  area: b.area, is_demo: true, created_at: createdAt,
});
const rawProduct = p => ({
  id: p.id, name: p.name, manufacturer: p.manufacturer, category: p.category,
  size_label: p.sizeLabel, pack_count: p.packCount, barcode: null, emoji: p.emoji,
  keywords: p.keywords, image_url: p.image?.uri ?? null,
  image_source_url: p.image?.sourceUrl ?? null, image_note: p.image?.note ?? null,
  is_demo: true, created_at: createdAt,
});
const rawOffer = o => ({
  id: o.id, product_id: o.productId, brand_id: branches.find(b => b.id === o.branchId).brandId,
  branch_id: o.branchId, channel: o.channel, kind: o.kind, pay_amount: o.payAmount,
  currency: 'KRW', pay_quantity: o.payQuantity, receive_quantity: o.receiveQuantity,
  condition: o.condition, observed_at: o.observedAt, starts_at: o.startsAt ?? null,
  ends_at: o.endsAt ?? null, source_label: o.source.label, source_note: o.source.note,
  source_url: null, stock: 'unknown', is_demo: true, created_at: createdAt,
});
function dataSet(overrides = {}) {
  return {
    brands: brands.map(rawBrand), branches: branches.map(rawBranch),
    products: products.map(rawProduct), price_observations: offers.map(rawOffer), ...overrides,
  };
}

// Supabase 호출 규약만 흉내 낸다. 실제 키나 네트워크 없이 필터·정렬·페이지·실패 경로를 시험한다.
function fakeClient(data, { pageSize = Infinity, fail } = {}) {
  const calls = [];
  const client = {
    calls,
    from(table) {
      const filters = [];
      const orders = [];
      let from = 0;
      let to = Infinity;
      let signal;
      let single = false;
      const builder = {
        select() { return builder; },
        eq(column, value) { filters.push({ column, test: row => row[column] === value }); return builder; },
        in(column, values) { filters.push({ column, test: row => values.includes(row[column]) }); return builder; },
        order(column, options = {}) { orders.push({ column, ascending: options.ascending !== false }); return builder; },
        range(first, last) { from = first; to = last; return builder; },
        limit(count) { to = from + count - 1; return builder; },
        maybeSingle() { single = true; return builder; },
        abortSignal(value) { signal = value; return builder; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            const call = { table, from, to, signal, single, orders, filterColumns: filters.map(f => f.column) };
            calls.push(call);
            if (signal?.aborted) return { data: null, error: { name: 'AbortError', message: 'request aborted' } };
            const failure = fail?.(call);
            if (failure) return { data: null, error: failure };
            const rows = (data[table] || []).filter(row => filters.every(f => f.test(row)));
            rows.sort((left, right) => {
              for (const order of orders) {
                const result = left[order.column] < right[order.column] ? -1 : left[order.column] > right[order.column] ? 1 : 0;
                if (result) return order.ascending ? result : -result;
              }
              return 0;
            });
            const page = rows.slice(from, Math.min(to + 1, from + pageSize));
            return { data: single ? page[0] ?? null : page, error: null };
          }).then(resolve, reject);
        },
      };
      return builder;
    },
  };
  return client;
}

test('DB 행 변환은 상품 규격·사진 출처와 새 품목을 보존한다', () => {
  const product = products.find(p => p.id === 'ramyeon-5');
  const mapped = mapProduct({ ...rawProduct(product), category: '새 품목' });
  assert.equal(mapped.id, product.id);
  assert.equal(mapped.packCount, 5);
  assert.equal(mapped.category, '새 품목');
  assert.deepEqual(mapped.image, product.image);
  assert.deepEqual(mapped.keywords, product.keywords);
  assert.equal(mapProduct(rawProduct(products.find(p => p.id === 'milk-1l'))).image, undefined);
  assert.equal(mapBranch(rawBranch(branches[0])).city, '대전광역시');
  assert.equal(mapBrand(rawBrand(brands[0])).name, '이마트');
});

test('DB 가격 변환은 미확인 금액과 지점 없는 온라인 가격을 보존한다', () => {
  const row = rawOffer(offers.find(o => o.id === 'milk-online'));
  const mapped = mapOffer({ ...row, branch_id: null, pay_amount: null });
  assert.equal(mapped.branchId, null);
  assert.equal(mapped.brandId, 'lotte');
  assert.equal(mapped.payAmount, null);
  assert.equal(mapped.channel, 'online');
  assert.deepEqual(mapped.source, { label: row.source_label, note: row.source_note, url: undefined });
  assert.equal(getOfferStatus(mapped, DEMO_AS_OF), 'unknown');
  for (const amount of [0, -1]) {
    const invalid = mapOffer({ ...row, pay_amount: amount });
    assert.equal(invalid.payAmount, amount);
    assert.equal(getOfferStatus(invalid, DEMO_AS_OF), 'unknown');
  }
});

test('손상된 DB 분류와 지점 없는 오프라인 가격은 정상 데이터처럼 노출하지 않는다', () => {
  const row = rawOffer(offers[0]);
  for (const overrides of [{ kind: 'bogus' }, { channel: 'bogus' }, { stock: 'available' }, { branch_id: null }]) {
    assert.throws(() => mapOffer({ ...row, ...overrides }));
  }
  assert.throws(() => mapBrand({ ...rawBrand(brands[0]), id: 'unknown-mart' }));
});

test('검색은 DB 상품을 사용하고 서버 반환 한도가 요청보다 작아도 다음 페이지를 빠뜨리지 않는다', async () => {
  const template = rawProduct(products[0]);
  const rows = Array.from({ length: 1101 }, (_, i) => ({
    ...template, id: `db-only-${String(i).padStart(4, '0')}`,
    name: i === 1100 ? '데이터베이스에만 있는 새우라면' : `새 상품 ${i}`,
    keywords: [], category: '새 품목',
  }));
  const client = fakeClient(dataSet({ products: rows }), { pageSize: 73 });
  const repo = createPriceRepository(client);
  const result = await repo.searchCatalog('새우라면');
  assert.deepEqual(result.map(p => p.id), ['db-only-1100']);
  const calls = client.calls.filter(c => c.table === 'products');
  assert.equal(calls[0].from, 0);
  assert.equal(calls[1].from, 73);
  assert.ok(calls.some(c => c.from > 1000));
});

test('DB 검색도 공백·전각·제조사·규격을 처리하며 실제 상품을 예시 검색에 섞지 않는다', async () => {
  const rows = [...products.map(rawProduct), { ...rawProduct(products[0]), id: 'real-only', name: '실제전용', is_demo: false }];
  const repo = createPriceRepository(fakeClient(dataSet({ products: rows })));
  assert.deepEqual((await repo.searchCatalog(' 서울우유 １ｌ ')).map(p => p.id), ['milk-1l']);
  assert.deepEqual((await repo.searchCatalog('농심 신라면 5개')).map(p => p.id), ['ramyeon-5']);
  assert.deepEqual(await repo.searchCatalog('실제전용'), []);
  assert.deepEqual(await repo.searchCatalog('존재하지않는상품'), []);
});

test('DB 조회 오류는 결과 없음이나 로컬 예시로 바뀌지 않고 실패로 전달된다', async () => {
  const client = fakeClient(dataSet(), {
    fail: call => call.table === 'products' ? { code: '42501', message: 'permission denied for table products' } : null,
  });
  const repo = createPriceRepository(client);
  await assert.rejects(repo.searchCatalog('우유'));
  await assert.rejects(repo.fetchProductComparison('milk-1l'));
});

test('두 번째 페이지가 실패해도 첫 페이지를 완성된 검색 결과로 반환하지 않는다', async () => {
  const client = fakeClient(dataSet(), {
    pageSize: 3,
    fail: call => call.table === 'products' && call.from > 0 ? { message: 'network unavailable' } : null,
  });
  await assert.rejects(createPriceRepository(client).searchCatalog('라면'));
  assert.ok(client.calls.some(c => c.table === 'products' && c.from === 3));
});

test('가격 또는 마트 조회가 실패하면 일부 데이터만으로 최저가를 표시하지 않는다', async () => {
  const priceFailure = fakeClient(dataSet(), {
    fail: call => call.table === 'price_observations' ? { message: 'price request failed' } : null,
  });
  await assert.rejects(createPriceRepository(priceFailure).fetchProductComparison('milk-1l'));
  const missingBrand = fakeClient(dataSet({ brands: brands.slice(0, 4).map(rawBrand) }));
  await assert.rejects(createPriceRepository(missingBrand).fetchProductComparison('milk-1l'));
});

test('조회에 AbortSignal을 전달하고 이미 취소된 요청은 성공하지 않는다', async () => {
  const client = fakeClient(dataSet(), { pageSize: 4 });
  const controller = new AbortController();
  const repo = createPriceRepository(client);
  await repo.searchCatalog('우유', controller.signal);
  assert.ok(client.calls.filter(c => c.table === 'products').every(c => c.signal === controller.signal));
  controller.abort();
  await assert.rejects(repo.searchCatalog('우유', controller.signal));
});

test('응답 도착 직후 취소된 검색은 이전 검색 결과로 전달되지 않는다', async () => {
  const controller = new AbortController();
  const client = fakeClient(dataSet(), {
    fail: () => { controller.abort(); return null; },
  });
  await assert.rejects(createPriceRepository(client).searchCatalog('라면', controller.signal), { name: 'AbortError' });
});

test('DB 비교 조회는 최신 미확인 가격을 보존하고 다른 지역·실제 가격을 제외한다', async () => {
  const data = dataSet();
  const regular = data.price_observations.find(o => o.id === 'milk-1l-lotte-seogu-regular');
  data.price_observations.push({ ...regular, id: 'db-newest-unknown', observed_at: '2026-10-29T11:00:00+09:00', pay_amount: null });
  data.branches.push({ ...data.branches[0], id: 'seoul-test', city: '서울특별시' });
  data.price_observations.push({ ...regular, id: 'seoul-cheap', brand_id: 'emart', branch_id: 'seoul-test', pay_amount: 1 });
  data.price_observations.push({ ...regular, id: 'real-cheap', pay_amount: 1, is_demo: false });
  const result = await createPriceRepository(fakeClient(data, { pageSize: 3 })).fetchProductComparison('milk-1l');
  assert.equal(result.product.id, 'milk-1l');
  assert.equal(result.asOf, DEMO_AS_OF);
  assert.equal(result.branches.length, 6);
  assert.deepEqual(result.brands.map(b => b.id), brands.map(b => b.id));
  assert.ok(result.offers.every(o => o.id !== 'real-cheap' && o.id !== 'seoul-cheap'));
  const compared = buildRegularComparisons(result.product.id, result.branches, result.offers, result.asOf);
  const lotte = compared.find(row => row.branch.id === 'lotte-seogu');
  assert.equal(lotte.offer.id, 'db-newest-unknown');
  assert.equal(lotte.amount, null);
  assert.equal(compared[0].amount, 2890);
});

test('가격 상세는 DB 기록과 원래 상품 비교를 연결하고 온라인의 NULL 지점을 허용한다', async () => {
  const data = dataSet();
  data.price_observations.find(o => o.id === 'milk-online').branch_id = null;
  const repo = createPriceRepository(fakeClient(data));
  const result = await repo.fetchPriceDetail('milk-online');
  assert.equal(result.offer.id, 'milk-online');
  assert.equal(result.offer.branchId, null);
  assert.equal(result.product.id, 'milk-1l');
  assert.equal(result.asOf, DEMO_AS_OF);
  assert.equal(await repo.fetchProductComparison('missing-product'), null);
  assert.equal(await repo.fetchPriceDetail('missing-offer'), null);
});
