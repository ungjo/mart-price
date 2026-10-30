import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, RemoteFeedback, palette, s } from '@/components/prices/ui';
import { DEFAULT_SELECTION } from '@/features/branches/selection';
import { useBranchSelection } from '@/providers/branch-selection-provider';

export function BranchSelectionLink({ count }: { count?: number }) {
  const { selection, ready, loadError } = useBranchSelection();
  const label = !ready ? (loadError ? '저장된 선택 확인 필요' : '저장된 선택 불러오는 중')
    : count !== undefined ? `${count}개 지점 비교`
    : selection.branchIds === null ? '전체 예시 지점 비교' : `저장된 ${selection.branchIds.length}개 지점`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`지역·지점 선택, ${label}`}
      onPress={() => router.push('/branches')}
      style={({ pressed }) => [styles.link, pressed && s.pressed]}>
      <View style={s.flex}>
        <Text style={styles.title}>대전광역시 · 비교할 지점</Text>
        <Text style={s.small}>{label}</Text>
      </View>
      <Text style={s.link}>변경 ›</Text>
    </Pressable>
  );
}

/** 저장값 복원이 끝나기 전에 전체 지점 최저가가 잠깐 표시되는 것을 막는다. */
export function SelectionRestoreFeedback() {
  const { loading, loadError, saveError, saving, retryLoad, saveSelection } = useBranchSelection();
  if (loading) return <RemoteFeedback loading error={null} onRetry={retryLoad} />;
  return (
    <View style={s.content}>
      <EmptyState title="저장된 지점 선택을 확인하지 못했어요"
        description={loadError ?? '선택 내용을 다시 불러와 주세요.'}
        buttonLabel="선택 다시 불러오기" onReset={retryLoad} />
      <Pressable accessibilityRole="button" disabled={saving}
        onPress={() => void saveSelection(DEFAULT_SELECTION)} style={[s.button, saving && s.pressed]}>
        <Text style={s.buttonText}>{saving ? '저장 중…' : '전체 지점으로 초기화'}</Text>
      </Pressable>
      {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1,
    borderColor: palette.border, borderRadius: 16, backgroundColor: palette.mint },
  title: { fontSize: 14, fontWeight: '700', color: palette.green, marginBottom: 5 },
  error: { color: palette.orange, fontSize: 13, lineHeight: 22 },
});
