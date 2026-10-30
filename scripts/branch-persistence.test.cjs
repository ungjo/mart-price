const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

const buildRoot = process.env.PRICES_TEST_BUILD;
if (!buildRoot) throw new Error('npm test로 실행하세요.');
const { createSelectionPersistence, BRANCH_SELECTION_STORAGE_KEY } = require(path.join(buildRoot, '../branches/persistence.js'));
const { DEFAULT_SELECTION } = require(path.join(buildRoot, '../branches/selection.js'));

function memoryStorage(initial = null) {
  let value = initial;
  const writes = [];
  return {
    writes,
    getItem: async key => {
      assert.equal(key, BRANCH_SELECTION_STORAGE_KEY);
      return value;
    },
    setItem: async (key, next) => {
      assert.equal(key, BRANCH_SELECTION_STORAGE_KEY);
      value = next;
      writes.push(next);
    },
  };
}

const selection = branchIds => ({ ...DEFAULT_SELECTION, district: '유성구', branchIds });

test('첫 실행은 전체 선택을 복원하고 저장소에 기본값을 쓰지 않는다', async () => {
  const storage = memoryStorage();
  assert.deepEqual(await createSelectionPersistence(storage).load(), DEFAULT_SELECTION);
  assert.deepEqual(storage.writes, []);
});

test('재시작한 저장 계층에서도 지역·여러 지점·명시적 빈 선택을 유지한다', async () => {
  const storage = memoryStorage();
  const first = createSelectionPersistence(storage);
  await first.save(selection(['emart-dunsan', 'homeplus-yuseong']));
  assert.deepEqual(await createSelectionPersistence(storage).load(), selection(['emart-dunsan', 'homeplus-yuseong']));
  await first.save(selection([]));
  assert.deepEqual(await createSelectionPersistence(storage).load(), selection([]));
});

test('손상된 저장 데이터는 덮어쓰지 않고 명시적인 초기화로만 복구한다', async () => {
  const storage = memoryStorage('{broken');
  const persistence = createSelectionPersistence(storage);
  await assert.rejects(persistence.load());
  assert.equal(storage.writes.length, 0);
  await persistence.save(DEFAULT_SELECTION);
  assert.deepEqual(await persistence.load(), DEFAULT_SELECTION);
});

test('저장소 읽기 실패는 빈 선택이나 전체 선택 성공으로 반환하지 않는다', async () => {
  const storage = memoryStorage();
  storage.getItem = async () => { throw new Error('blocked storage'); };
  await assert.rejects(createSelectionPersistence(storage).load(), /blocked storage/);
  assert.equal(storage.writes.length, 0);
});

test('쓰기 실패 뒤에는 기존 저장 내용이 남고 다음 저장은 다시 시도할 수 있다', async () => {
  const storage = memoryStorage(JSON.stringify(selection(['old-branch'])));
  const originalWrite = storage.setItem;
  let fail = true;
  storage.setItem = async (...args) => {
    if (fail) throw new Error('disk full');
    return originalWrite(...args);
  };
  const persistence = createSelectionPersistence(storage);
  await assert.rejects(persistence.save(selection(['new-branch'])), /disk full/);
  assert.deepEqual(await persistence.load(), selection(['old-branch']));
  fail = false;
  await persistence.save(selection(['new-branch']));
  assert.deepEqual(await persistence.load(), selection(['new-branch']));
});

test('느린 첫 저장과 다음 저장은 요청 순서를 지키고 조회는 완료된 최신 값을 읽는다', async () => {
  const storage = memoryStorage();
  const originalWrite = storage.setItem;
  let release;
  const firstGate = new Promise(resolve => { release = resolve; });
  const started = [];
  storage.setItem = async (key, value) => {
    started.push(JSON.parse(value).branchIds);
    if (started.length === 1) await firstGate;
    return originalWrite(key, value);
  };
  const persistence = createSelectionPersistence(storage);
  const first = persistence.save(selection(['first']));
  const second = persistence.save(selection(['second']));
  const read = persistence.load();
  await Promise.resolve();
  assert.deepEqual(started, [['first']]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(started, [['first'], ['second']]);
  assert.deepEqual(await read, selection(['second']));
});

test('저장 요청 후 호출자가 배열을 바꿔도 저장할 값은 바뀌지 않는다', async () => {
  const storage = memoryStorage();
  const persistence = createSelectionPersistence(storage);
  const next = selection(['selected']);
  const save = persistence.save(next);
  next.branchIds.push('late-mutation');
  await save;
  assert.deepEqual(await persistence.load(), selection(['selected']));
});
