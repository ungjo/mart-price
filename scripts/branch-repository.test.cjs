const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const buildRoot = process.env.PRICES_TEST_BUILD;
if (!buildRoot) throw new Error('npm test로 실행하세요.');
const { createBranchRepository } = require(path.join(buildRoot, '../branches/repository.js'));
const { brands, branches } = require(path.join(buildRoot, 'demo-data.js'));
function dataSet() {
  return {
    brands: brands.map(brand => ({ ...brand, created_at: '2026-10-29T00:00:00Z' })),
    branches: branches.map(branch => ({
      id: branch.id, brand_id: branch.brandId, name: branch.name, city: '대전광역시',
      district: branch.district, area: branch.area, is_demo: true, created_at: '2026-10-29T00:00:00Z',
    })),
  };
}
function fakeClient(data, { pageSize = 2, fail } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      const filters = [];
      let start = 0;
      let end = Infinity;
      let signal;
      const query = {
        select() { return query; },
        eq(column, value) { filters.push(row => row[column] === value); return query; },
        in(column, values) { filters.push(row => values.includes(row[column])); return query; },
        order() { return query; },
        range(from, to) { start = from; end = to; return query; },
        abortSignal(value) { signal = value; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            const call = { table, start, signal };
            calls.push(call);
            const error = fail?.(call);
            if (error) return { data: null, error };
            const rows = data[table].filter(row => filters.every(filter => filter(row)))
              .sort((a, b) => a.id.localeCompare(b.id));
            return { data: rows.slice(start, Math.min(end + 1, start + pageSize)), error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test('지점 목록은 작은 서버 페이지 제한에도 대전 예시 지점과 5개 마트를 모두 읽는다', async () => {
  const data = dataSet();
  data.branches.push({ ...data.branches[0], id: 'seoul', city: '서울특별시' });
  data.branches.push({ ...data.branches[0], id: 'real', is_demo: false });
  const client = fakeClient(data);
  const controller = new AbortController();
  const result = await createBranchRepository(client).fetchBranchCatalog(controller.signal);
  assert.deepEqual(result.brands.map(brand => brand.id), brands.map(brand => brand.id));
  assert.equal(result.branches.length, 6);
  assert.ok(result.branches.every(branch => branch.city === '대전광역시'));
  assert.ok(client.calls.every(call => call.signal === controller.signal));
  assert.ok(client.calls.some(call => call.table === 'branches' && call.start === 6));
});

test('지점 목록의 중간 페이지 실패와 누락된 브랜드는 일부 목록으로 성공하지 않는다', async () => {
  const client = fakeClient(dataSet(), { fail: call => call.table === 'branches' && call.start === 2 ? { message: 'network failed' } : null });
  await assert.rejects(createBranchRepository(client).fetchBranchCatalog());
  const data = dataSet();
  data.brands.pop();
  await assert.rejects(createBranchRepository(fakeClient(data)).fetchBranchCatalog());
});

test('등록된 지점이 없는 응답은 정상 빈 목록이며 예시 배열로 대체하지 않는다', async () => {
  const data = dataSet();
  data.branches = [];
  const result = await createBranchRepository(fakeClient(data)).fetchBranchCatalog();
  assert.deepEqual(result.branches, []);
  assert.equal(result.brands.length, 5);
});

test('이미 취소되었거나 응답 도중 취소된 지점 조회는 목록을 전달하지 않는다', async () => {
  const controller = new AbortController();
  const client = fakeClient(dataSet());
  controller.abort();
  await assert.rejects(createBranchRepository(client).fetchBranchCatalog(controller.signal), { name: 'AbortError' });
  assert.equal(client.calls.length, 0);
  const pending = new AbortController();
  const aborted = fakeClient(dataSet(), { fail: () => { pending.abort(); return null; } });
  await assert.rejects(createBranchRepository(aborted).fetchBranchCatalog(pending.signal), { name: 'AbortError' });
});
