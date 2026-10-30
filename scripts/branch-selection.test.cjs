const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const buildRoot = process.env.PRICES_TEST_BUILD;
if (!buildRoot) throw new Error('npm test로 실행하세요.');
const { DEFAULT_SELECTION, DAEJEON_DISTRICTS, parseSelection, serializeSelection, selectBranches, getMissingBranchIds } = require(path.join(buildRoot, '../branches/selection.js'));
const { buildRegularComparisons } = require(path.join(buildRoot, 'comparison.js'));
const { buildBrandSummaries } = require(path.join(buildRoot, 'brand-summary.js'));
const { branches: fixtures, brands, offers, DEMO_AS_OF } = require(path.join(buildRoot, 'demo-data.js'));
const branches = fixtures.map(branch => ({ ...branch, city: '대전광역시' }));

test('처음 실행한 전체 선택과 사용자가 명시한 빈 선택은 저장 후에도 다르다', () => {
  assert.deepEqual(parseSelection(null), DEFAULT_SELECTION);
  assert.equal(selectBranches(branches, parseSelection(null)).length, 6);
  const empty = parseSelection(serializeSelection({ ...DEFAULT_SELECTION, branchIds: [] }));
  assert.deepEqual(empty.branchIds, []);
  assert.deepEqual(selectBranches(branches, empty), []);
  assert.equal(DAEJEON_DISTRICTS.length, 5);
  assert.ok(DAEJEON_DISTRICTS.includes('중구'));
});

test('구 필터를 바꿔도 다른 구에서 선택한 지점은 유지된다', () => {
  const selected = { ...DEFAULT_SELECTION, district: '서구', branchIds: ['homeplus-yuseong', 'lotte-seogu'] };
  assert.deepEqual(selectBranches(branches, selected).map(branch => branch.id), ['homeplus-yuseong', 'lotte-seogu']);
  const restored = parseSelection(serializeSelection(selected));
  assert.deepEqual(restored, selected);
  assert.equal(restored.district, '서구');
});

test('사라진 지점과 다른 도시의 ID는 제외하며 모두 사라져도 전체로 돌아가지 않는다', () => {
  const catalog = [...branches, { ...branches[0], id: 'seoul', city: '서울특별시' }];
  const selected = { ...DEFAULT_SELECTION, branchIds: ['deleted', 'seoul'] };
  assert.deepEqual(selectBranches(catalog, selected), []);
  assert.deepEqual(getMissingBranchIds(catalog, selected), ['deleted', 'seoul']);
  assert.equal(selectBranches(catalog, DEFAULT_SELECTION).length, 6);
  assert.deepEqual(getMissingBranchIds(catalog, DEFAULT_SELECTION), []);
});

test('저장 형식·버전·도시·구·지점 ID가 손상되면 조용히 전체 선택으로 바꾸지 않는다', () => {
  for (const value of [null, [], {}, { ...DEFAULT_SELECTION, version: 2 },
    { ...DEFAULT_SELECTION, city: '서울특별시' }, { ...DEFAULT_SELECTION, district: '없는구' },
    { ...DEFAULT_SELECTION, branchIds: 'all' }, { ...DEFAULT_SELECTION, branchIds: [3] },
    { ...DEFAULT_SELECTION, branchIds: [' '] }]) {
    assert.throws(() => parseSelection(JSON.stringify(value)));
  }
  assert.throws(() => parseSelection('{broken'));
  assert.throws(() => serializeSelection({ ...DEFAULT_SELECTION, branchIds: [''] }));
  const restored = parseSelection(JSON.stringify({ ...DEFAULT_SELECTION, branchIds: ['emart-dunsan', 'emart-dunsan'] }));
  assert.deepEqual(restored.branchIds, ['emart-dunsan']);
});

test('선택한 지점만으로 최저가를 다시 계산하고 선택 안 한 마트는 가격 미확인과 구분할 수 있다', () => {
  const selected = selectBranches(branches, { ...DEFAULT_SELECTION, branchIds: ['emart-dunsan', 'emart-yuseong'] });
  const rows = buildRegularComparisons('milk-1l', selected, offers, DEMO_AS_OF);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].amount, 2980);
  assert.equal(rows[0].isLowest, true);
  const summaries = buildBrandSummaries(brands, rows);
  assert.equal(summaries.length, 5);
  assert.equal(summaries.find(summary => summary.brand.id === 'homeplus').branchCount, 0);
  const unknown = buildRegularComparisons('milk-1l', selectBranches(branches, { ...DEFAULT_SELECTION, branchIds: ['express-donggu'] }), offers, DEMO_AS_OF);
  const express = buildBrandSummaries(brands, unknown).find(summary => summary.brand.id === 'express');
  assert.equal(express.branchCount, 1);
  assert.equal(express.knownBranchCount, 0);
  assert.equal(express.lowestAmount, null);
});

test('선택 지점의 최신 미확인 가격도 과거 싼 가격으로 되돌리지 않는다', () => {
  const selected = selectBranches(branches, { ...DEFAULT_SELECTION, branchIds: ['lotte-seogu'] });
  const old = offers.find(offer => offer.id === 'milk-1l-lotte-seogu-regular');
  const current = { ...old, id: 'latest-unknown', observedAt: '2026-10-29T11:00:00+09:00', payAmount: null };
  const rows = buildRegularComparisons('milk-1l', selected, [...offers, current], DEMO_AS_OF);
  assert.equal(rows[0].offer.id, 'latest-unknown');
  assert.equal(rows[0].amount, null);
  assert.equal(rows[0].isLowest, false);
});
