import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { createSelectionPersistence } from '@/features/branches/persistence';
import { DEFAULT_SELECTION, type BranchSelection } from '@/features/branches/selection';

type SelectionState = {
  selection: BranchSelection;
  ready: boolean;
  loading: boolean;
  loadError: string | null;
  saveError: string | null;
  saving: boolean;
};
type SelectionContext = SelectionState & {
  saveSelection(selection: BranchSelection): Promise<boolean>;
  retryLoad(): void;
};

const Context = createContext<SelectionContext | null>(null);
const persistence = createSelectionPersistence(AsyncStorage);

export function BranchSelectionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SelectionState>({
    selection: DEFAULT_SELECTION,
    ready: false,
    loading: true,
    loadError: null,
    saveError: null,
    saving: false,
  });
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const saving = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const requestGeneration = generation.current;
    // 서버/웹 최초 렌더링은 저장소를 읽지 않는다. 복원이 끝나기 전에는 비교를 보류하고,
    // 초기 기본값을 저장하지 않아 이전에 고른 지점이나 명시적인 빈 선택([])을 보존한다.
    void persistence.load().then((selection) => {
      if (!active || !mounted.current || generation.current !== requestGeneration) return;
      setState({ selection, ready: true, loading: false, loadError: null, saveError: null, saving: false });
    }).catch(() => {
      if (!active || !mounted.current || generation.current !== requestGeneration) return;
      setState((previous) => ({
        ...previous,
        ready: false,
        loading: false,
        loadError: '저장된 지점 선택을 불러오지 못했어요. 다시 불러오거나 선택을 초기화해 주세요.',
      }));
    });
    return () => { active = false; };
  }, [attempt]);

  const retryLoad = useCallback(() => {
    if (saving.current) return;
    generation.current += 1;
    setState((previous) => ({ ...previous, ready: false, loading: true, loadError: null, saveError: null }));
    setAttempt((previous) => previous + 1);
  }, []);

  const saveSelection = useCallback(async (selection: BranchSelection): Promise<boolean> => {
    // 같은 버튼을 연속으로 눌러도 저장 중인 선택이 역전되지 않게 한 번씩 적용한다.
    if (saving.current) return false;
    saving.current = true;
    generation.current += 1;
    setState((previous) => ({ ...previous, saving: true, saveError: null }));
    try {
      const saved = await persistence.save(selection);
      if (mounted.current) {
        // 저장 성공 뒤에만 공통 선택을 교체한다. 저장 실패 시 현재 비교 범위는 유지한다.
        setState({ selection: saved, ready: true, loading: false, loadError: null, saveError: null, saving: false });
      }
      return true;
    } catch {
      if (mounted.current) {
        setState((previous) => ({
          ...previous,
          loading: false,
          saving: false,
          loadError: previous.ready ? null : (previous.loadError ?? '지점 선택을 복원하지 못했어요. 다시 불러오거나 초기화해 주세요.'),
          saveError: '선택 내용을 저장하지 못했어요. 기기 저장 공간과 브라우저 설정을 확인하고 다시 시도해 주세요.',
        }));
      }
      return false;
    } finally {
      saving.current = false;
    }
  }, []);

  return <Context.Provider value={{ ...state, saveSelection, retryLoad }}>{children}</Context.Provider>;
}

export function useBranchSelection(): SelectionContext {
  const context = useContext(Context);
  if (!context) throw new Error('BranchSelectionProvider 안에서 사용해야 합니다.');
  return context;
}
