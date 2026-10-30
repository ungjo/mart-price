import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { PriceDataError } from '@/features/prices/data-error';

type RemoteState<T> = {
  key: string;
  data: T | null;
  error: string | null;
  loading: boolean;
};

/** 검색어·주소 변경과 화면 복귀 때 다시 조회하고, 지난 요청이 새 화면을 덮어쓰지 않게 한다. */
export function useRemoteResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify([key, attempt]);
  const [state, setState] = useState<RemoteState<T>>({ key: requestKey, data: null, error: null, loading: enabled });
  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    setState({ key: requestKey, data: null, error: null, loading: true });

    // 연결이 끊겨 응답이 끝나지 않아도 무한 로딩 대신 재시도할 수 있게 한다.
    const timeout = setTimeout(() => {
      if (!active) return;
      active = false;
      controller.abort();
      setState({ key: requestKey, data: null, error: '응답이 지연되고 있어요. 연결 상태를 확인하고 다시 시도해 주세요.', loading: false });
    }, 20_000);

    void Promise.resolve().then(() => load(controller.signal)).then((data) => {
      if (active) setState({ key: requestKey, data, error: null, loading: false });
    }).catch((error: unknown) => {
      // 실패를 검색 결과 0개나 로컬 예시 가격으로 바꾸지 않는다.
      if (active) setState({
        key: requestKey, data: null,
        error: error instanceof PriceDataError ? error.message : '데이터를 불러오지 못했어요. 다시 시도해 주세요.',
        loading: false,
      });
    }).finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [requestKey, load, enabled]));

  // effect 실행 전 한 프레임에도 이전 검색어/상품의 데이터가 새 제목 아래 표시되지 않는다.
  const current = !enabled || state.key !== requestKey
    ? { key: requestKey, data: null, error: null, loading: enabled }
    : state;
  return { ...current, reload };
}
