import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SelectionRestoreFeedback } from '@/components/branches/selection-controls';
import { Badge, DemoNotice, Page, RemoteFeedback, SectionTitle, palette, s } from '@/components/prices/ui';
import { fetchBranchCatalog, type BranchCatalog } from '@/features/branches/repository';
import { DAEJEON_DISTRICTS, getMissingBranchIds, selectBranches } from '@/features/branches/selection';
import { useRemoteResource } from '@/hooks/use-remote-resource';
import { useBranchSelection } from '@/providers/branch-selection-provider';

function SelectionForm({ catalog, onApplied }: { catalog: BranchCatalog; onApplied: () => void }) {
  const { selection, saving, saveError, saveSelection } = useBranchSelection();
  const [district, setDistrict] = useState(selection.district);
  // 화면 안의 임시 선택만 바꾸고, 적용 버튼으로 저장에 성공했을 때 비교 화면에 반영한다.
  const [ids, setIds] = useState(() => selectBranches(catalog.branches, selection).map((branch) => branch.id));
  const visibleBranches = catalog.branches.filter((branch) => district === null || branch.district === district);
  const missing = getMissingBranchIds(catalog.branches, selection).length;
  const hiddenSelected = ids.filter((id) => !visibleBranches.some((branch) => branch.id === id)).length;
  const toggle = (id: string) => setIds((previous) => previous.includes(id)
    ? previous.filter((item) => item !== id) : [...previous, id]);
  const apply = async () => {
    const saved = await saveSelection({ version: 1, city: '대전광역시', district, branchIds: ids });
    if (saved) onApplied();
  };
  return (
    <>
      <ScrollView contentContainerStyle={s.content}>
        <View style={styles.intro}>
          <Badge>대전시 예시 지점</Badge>
          <Text accessibilityRole="header" style={s.title}>어느 지점을 비교할까요?</Text>
          <Text style={s.body}>방문할 지점을 여러 개 선택하세요. 선택 내용은 이 기기에 저장됩니다.</Text>
        </View>
        <View>
          <SectionTitle title="지역으로 지점 찾기" note="현재는 대전광역시 예시 데이터만 제공합니다." />
          <View accessibilityRole="radiogroup" accessibilityLabel="대전시 구 선택" style={s.wrap}>
            {[null, ...DAEJEON_DISTRICTS].map((item) => (
              <Pressable key={item ?? 'all'} accessibilityRole="radio" accessibilityLabel={item ?? '대전 전체'}
                aria-checked={district === item} disabled={saving}
                onPress={() => setDistrict(item)} style={[s.chip, district === item && s.chipActive]}>
                <Text style={[s.chipText, district === item && s.chipTextActive]}>{item ?? '대전 전체'}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>지역을 바꿔도 다른 구에서 선택한 지점은 유지됩니다.</Text>
        </View>
        <View style={[s.card, styles.summary]}>
          <Text accessibilityLiveRegion="polite" style={s.sectionTitle}>총 {ids.length}개 지점 선택</Text>
          {hiddenSelected > 0 ? <Text style={s.small}>다른 지역 목록에서 선택한 {hiddenSelected}개 지점 포함</Text> : null}
          <View style={s.wrap}>
            <Pressable accessibilityRole="button" disabled={saving}
              onPress={() => setIds(catalog.branches.map((branch) => branch.id))} style={s.chip}>
              <Text style={s.link}>전체 지점 선택</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => setIds([])} style={s.chip}>
              <Text style={s.link}>전체 선택 해제</Text>
            </Pressable>
          </View>
          {ids.length === 0 ? <Text style={s.small}>선택한 지점이 없으면 매장 가격을 비교하지 않습니다.</Text> : null}
          {missing > 0 ? <Text style={styles.hint}>더 이상 조회되지 않는 저장 지점 {missing}개는 비교에서 제외했습니다. 적용하면 선택 목록도 정리됩니다.</Text> : null}
        </View>
        <View>
          <SectionTitle title={`${district ?? '대전 전체'} · ${visibleBranches.length}개 지점`}
            note="실제 주소와 거리 정보가 없는 가상 지점입니다." />
          <View style={styles.list}>
            {visibleBranches.map((branch) => {
              const brand = catalog.brands.find((item) => item.id === branch.brandId)!;
              const checked = ids.includes(branch.id);
              return (
                <Pressable key={branch.id} accessibilityRole="checkbox"
                  accessibilityLabel={`${brand.name} ${branch.name}`} aria-checked={checked} aria-disabled={saving}
                  disabled={saving} onPress={() => toggle(branch.id)}
                  style={({ pressed }) => [s.card, styles.branch, checked && styles.selected, pressed && s.pressed]}>
                  <View style={[styles.checkbox, checked && styles.checked]}>
                    <Text style={styles.checkText}>{checked ? '✓' : ''}</Text>
                  </View>
                  <View style={s.flex}>
                    <Text style={[s.eyebrow, { color: brand.color }]}>{brand.name}</Text>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    <Text style={s.small}>{branch.district} · {branch.area}</Text>
                  </View>
                  <Badge>예시</Badge>
                </Pressable>
              );
            })}
            {visibleBranches.length === 0 ? <View style={s.card}>
              <Text style={s.sectionTitle}>등록된 예시 지점이 없어요</Text>
              <Text style={s.body}>다른 구 또는 대전 전체를 선택해 주세요.</Text>
            </View> : null}
          </View>
        </View>
        <DemoNotice />
      </ScrollView>
      <View style={styles.actions}>
        {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
        <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
          onPress={() => void apply()} style={[s.button, saving && s.pressed]}>
          <Text style={s.buttonText}>{saving ? '선택 저장 중…' : `${ids.length}개 지점으로 비교 적용`}</Text>
        </Pressable>
        <Text style={[s.small, s.center]}>뒤로 가면 적용하지 않은 변경은 취소됩니다.</Text>
      </View>
    </>
  );
}

export default function BranchSelectionScreen() {
  const { ready, selection } = useBranchSelection();
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; };
  }, []));
  const onApplied = useCallback(() => {
    // 저장 중 사용자가 먼저 뒤로 갔다면 완료 응답으로 다시 뒤로 이동하지 않는다.
    // 저장 후 폼이 새 선택값으로 재생성되어도 화면의 포커스 상태는 유지한다.
    if (!focused.current) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  const load = useCallback((signal: AbortSignal) => fetchBranchCatalog(signal), []);
  const resource = useRemoteResource('branch-catalog', load);
  return (
    <Page title="지역·지점 선택" backTo="/">
      {!ready ? <SelectionRestoreFeedback />
        : resource.loading || resource.error ? <RemoteFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
        : resource.data ? <SelectionForm key={JSON.stringify(selection)} catalog={resource.data} onApplied={onApplied} /> : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 8 },
  hint: { fontSize: 12, color: palette.muted, lineHeight: 20, marginTop: 12 },
  summary: { gap: 12 },
  list: { gap: 10 },
  branch: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 100 },
  selected: { borderColor: palette.green, backgroundColor: '#F0F6EE' },
  branchName: { color: palette.ink, fontSize: 15, fontWeight: '700', marginVertical: 5 },
  checkbox: { width: 25, height: 25, borderRadius: 7, borderWidth: 1.5, borderColor: palette.muted, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: palette.green, backgroundColor: palette.green },
  checkText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  actions: { paddingHorizontal: 22, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.paper },
  error: { color: palette.orange, fontSize: 13, lineHeight: 21 },
});
