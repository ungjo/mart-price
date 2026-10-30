import { StyleSheet, Text, View } from 'react-native';

import type { BrandPriceSummary as BrandSummary } from '@/features/prices/brand-summary';
import { formatWon } from '@/features/prices/comparison';

import { Badge, SectionTitle, palette, s } from './ui';

export function BrandPriceSummary({ summaries }: { summaries: BrandSummary[] }) {

  return (
    <View>
      <SectionTitle title="5개 마트 가격 한눈에 보기" note="같은 상품·용량·수량의 일반 매장가" />
      <View style={[s.card, styles.card]}>
        <Badge>예시 가격</Badge>
        {summaries.map((summary, index) => (
          <View key={summary.brand.id} style={[styles.row, index > 0 && styles.divider]}>
            <View style={styles.label}>
              <View style={[styles.dot, { backgroundColor: summary.brand.color }]} />
              <View style={s.flex}>
                <Text style={styles.brand}>{summary.brand.name}</Text>
                <Text style={s.small}>
                  {summary.cheapestBranchName ?? '확인된 지점 가격 없음'}
                </Text>
                <Text style={styles.count}>
                  {summary.knownBranchCount}/{summary.branchCount}개 지점 가격 확인
                </Text>
              </View>
            </View>
            <View style={styles.price}>
              <Text style={[styles.amount, summary.lowestAmount === null && styles.unknown]}>
                {summary.lowestAmount === null ? '가격 미확인' : formatWon(summary.lowestAmount)}
              </Text>
              {summary.lowestAmount !== null ? <Text style={s.small}>확인된 지점 중 최저</Text> : null}
            </View>
          </View>
        ))}
        <Text style={styles.scope}>대전 예시 지점 기준 · 브랜드 전체 공통 가격이 아닙니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 17, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  label: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, minWidth: 0 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  brand: { color: palette.ink, fontSize: 14, fontWeight: '700', lineHeight: 21, marginBottom: 3 },
  count: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  price: { alignItems: 'flex-end', flexShrink: 0, gap: 3 },
  amount: { color: palette.green, fontSize: 19, fontWeight: '800' },
  unknown: { color: palette.muted, fontSize: 14 },
  scope: { color: palette.muted, fontSize: 12, lineHeight: 19, paddingTop: 9, borderTopWidth: 1, borderTopColor: palette.border },
});
