import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// 별도 이벤트 구독은 필요 없다. 함수 참조를 고정해 렌더마다 재구독하지 않게 한다.
const subscribeToHydration = () => () => {};
// React는 서버 렌더와 첫 hydration에는 false, 이후 클라이언트 렌더에는 true를 읽는다.
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * 서버 HTML과 브라우저의 첫 화면을 light 테마로 일치시켜 hydration 불일치를 방지한다.
 * hydration(서버 HTML에 React 동작을 연결하는 과정)이 끝나면 기기 테마를 사용한다.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot
  );
  // 실제 기기 테마 변경 구독은 React Native 훅이 담당하므로 항상 호출한다.
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
