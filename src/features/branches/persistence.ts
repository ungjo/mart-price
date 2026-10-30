import { parseSelection, serializeSelection, type BranchSelection } from './selection';

export const BRANCH_SELECTION_STORAGE_KEY = '@mart-price/branch-selection/demo-daejeon/v1';

export type SelectionStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

/** 기기 저장소를 주입해 실제 저장 기능과 읽기 실패·쓰기 순서를 독립적으로 검증한다. */
export function createSelectionPersistence(storage: SelectionStorage) {
  let pendingWrites = Promise.resolve();

  async function load(): Promise<BranchSelection> {
    await pendingWrites;
    // 손상된 값은 전체 선택으로 바꾸지 않는다. 사용자가 재시도하거나 명시적으로 초기화한다.
    return parseSelection(await storage.getItem(BRANCH_SELECTION_STORAGE_KEY));
  }

  async function save(selection: BranchSelection): Promise<BranchSelection> {
    const payload = serializeSelection(selection);
    const snapshot = parseSelection(payload);
    // 빠른 연속 저장에서도 이전 쓰기가 뒤늦게 끝나 최신 선택을 덮어쓰지 않게 직렬화한다.
    const operation = pendingWrites.then(async () => {
      await storage.setItem(BRANCH_SELECTION_STORAGE_KEY, payload);
      return snapshot;
    });
    // 한 번 실패한 쓰기가 이후 재시도까지 막지는 않되, 호출자에게는 원래 실패를 전달한다.
    pendingWrites = operation.then(() => undefined, () => undefined);
    return operation;
  }

  return { load, save };
}
