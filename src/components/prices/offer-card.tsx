import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, palette, s } from './ui';
import { formatDateTime, formatWon, getBranch, getBrand, getEffectiveUnitPrice, getOfferStatus } from '@/features/prices/comparison';
import type { Offer } from '@/features/prices/types';

export const offerKindLabels = { regular: '일반가', member: '회원가', card: '카드가', bundle: '묶음 행사' };
export const offerStatusLabels = { available: '가격 확인', unknown: '가격 미확인', expired: '행사 종료', upcoming: '행사 예정' };

export function OfferCard({ offer, isLowest = false }: { offer: Offer; isLowest?: boolean }) {
  const branch = getBranch(offer.branchId);
  if (!branch) return null;
  const brand = getBrand(branch.brandId);
  const status = getOfferStatus(offer);
  const effective = getEffectiveUnitPrice(offer);
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={`${brand.name} ${branch.name}, ${offer.channel === 'offline' ? '매장' : '온라인'}, ${offerKindLabels[offer.kind]}, ${offerStatusLabels[status]}, ${status !== 'unknown' && offer.payAmount !== null ? formatWon(offer.payAmount) + ' 결제' : '금액 미확인'}, 상품 ${offer.receiveQuantity}개 수령${isLowest ? ', 최저가' : ''}. 가격 상세 보기`}
      onPress={() => router.push({ pathname: '/prices/[offerId]', params: { offerId: offer.id } })}
      style={({ pressed }) => [s.card, styles.card, isLowest && styles.lowest, pressed && s.pressed]}>
      <View style={s.row}>
        <View style={s.flex}>
          <Text style={[styles.brandName, { color: brand.color }]}>{brand.name}</Text>
          <Text style={styles.branch}>{branch.name}</Text>
          <Text style={s.small}>대전 {branch.district} · {branch.area}</Text>
        </View>
        {isLowest ? <Badge>최저가</Badge> : <Badge warm={offer.kind !== 'regular'}>{offerKindLabels[offer.kind]}</Badge>}
      </View>
      <View style={styles.priceLine}>
        <Text style={s.small}>{offer.channel === 'online' ? '온라인 상품가 · 배송비 별도' : '매장 결제 금액'}</Text>
        <Text style={[styles.amount, status !== 'available' && styles.inactive]}>
          {status === 'unknown' || offer.payAmount === null ? '가격 미확인' : formatWon(offer.payAmount)}
        </Text>
      </View>
      {status !== 'unknown' && offer.receiveQuantity > 1 && effective !== null ? (
        <Text style={styles.quantity}>총 {formatWon(offer.payAmount!)} 결제 · 상품 {offer.receiveQuantity}개 수령{ '\n' }상품 1개당 {formatWon(effective)} (환산가)</Text>
      ) : null}
      {offer.kind !== 'regular' || offer.channel === 'online' ? <Text style={s.small}>{offer.condition}</Text> : null}
      <View style={styles.meta}>
        <Text style={[s.small, status !== 'available' && s.warmText]}>
          {status === 'available' ? `${formatDateTime(offer.observedAt)} 확인` : offerStatusLabels[status]}
        </Text>
        <Text style={s.link}>상세 보기 ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  lowest: { borderColor: palette.green, borderWidth: 1.5, backgroundColor: '#FDFFFA' },
  brandName: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  branch: { fontSize: 17, fontWeight: '700', color: palette.ink, marginBottom: 4 },
  priceLine: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  amount: { fontSize: 24, fontWeight: '800', color: palette.ink },
  inactive: { color: palette.muted },
  quantity: { fontSize: 13, lineHeight: 22, color: palette.orange },
  meta: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
});
