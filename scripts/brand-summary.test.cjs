const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const buildRoot = process.env.PRICES_TEST_BUILD;
if (!buildRoot) throw new Error('npm test로 실행하세요.');
const { buildBrandSummaries } = require(path.join(buildRoot, 'brand-summary.js'));
const { buildRegularComparisons } = require(path.join(buildRoot, 'comparison.js'));
const { brands, branches, products, offers, DEMO_AS_OF } = require(path.join(buildRoot, 'demo-data.js'));

// DB에서 받은 목록으로도 같은 규칙을 적용할 수 있도록 예시 조회는 테스트 내부에만 둔다.
const getBrandSummaries = productId => buildBrandSummaries(brands, products.some(product => product.id === productId)
  ? buildRegularComparisons(productId, branches, offers, DEMO_AS_OF) : []);

test('마트별 요약에는 가격 미확인 마트를 포함한 다섯 브랜드가 항상 같은 순서로 표시된다', () => {
  const summaries = getBrandSummaries('milk-1l');
  assert.deepEqual(summaries.map((summary) => summary.brand.id), brands.map((brand) => brand.id));
  const express = summaries.find((summary) => summary.brand.id === 'express');
  assert.equal(express.lowestAmount, null);
  assert.equal(express.knownBranchCount, 0);
  assert.equal(express.branchCount, 1);
  assert.equal(express.cheapestBranchName, null);
});

test('같은 마트의 여러 지점은 최저가 지점명과 확인 지점 수를 함께 제공한다', () => {
  const emart = getBrandSummaries('milk-1l').find((summary) => summary.brand.id === 'emart');
  assert.equal(emart.lowestAmount, 2980);
  assert.equal(emart.branchCount, 2);
  assert.equal(emart.knownBranchCount, 2);
  assert.equal(emart.cheapestBranchName, '둔산 예시점');
});

test('브랜드 요약에 더 싼 회원가와 온라인가를 섞지 않는다', () => {
  const summaries = getBrandSummaries('milk-1l');
  assert.equal(summaries.find((summary) => summary.brand.id === 'emart').lowestAmount, 2980);
  assert.equal(summaries.find((summary) => summary.brand.id === 'lotte').lowestAmount, 2780);
  assert.equal(summaries.find((summary) => summary.brand.id === 'homeplus').lowestAmount, 2890);
});

test('등록되지 않은 상품은 가짜 가격이나 지점명을 만들지 않는다', () => {
  const summaries = getBrandSummaries('missing-product-id');
  assert.equal(summaries.length, 5);
  assert.ok(summaries.every((summary) => summary.lowestAmount === null
    && summary.knownBranchCount === 0 && summary.cheapestBranchName === null));
});
