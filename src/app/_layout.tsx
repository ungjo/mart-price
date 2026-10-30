import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/components/prices/ui';
import { BranchSelectionProvider } from '@/providers/branch-selection-provider';

export default function RootLayout() {
  // 검색 → 상품 비교 → 가격 상세를 하나의 스택으로 연결해 뒤로 갈 때 검색 상태를 보존한다.
  // 첫 데모는 밝은 색상으로 통일한다. 네이티브 스플래시는 Expo의 기본 자동 숨김을 사용한다.
  return (
    <ThemeProvider value={DefaultTheme}>
      <BranchSelectionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ title: '마트프라이스', headerShown: false, contentStyle: { backgroundColor: palette.background } }} />
      </BranchSelectionProvider>
    </ThemeProvider>
  );
}
