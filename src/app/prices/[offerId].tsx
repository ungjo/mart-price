import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { offerKindLabels, offerStatusLabels } from '@/components/prices/offer-card';
import { Badge, DemoNotice, EmptyState, Page, ProductHero, SectionTitle, palette, s } from '@/components/prices/ui';
import { formatDateTime, formatWon, getBranch, getBrand, getEffectiveUnitPrice, getOffer, getOfferStatus, getProduct, getRegularComparisons } from '@/features/prices/comparison';

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

export default function PriceDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  // URL의 ID는 외부 입력이다. 없는 가격·상품·지점이면 계산을 진행하지 않고 복구 경로를 제공한다.
  const offer = getOffer(typeof offerId === 'string' ? offerId : '');
  const product = offer ? getProduct(offer.productId) : undefined;
  const branch = offer ? getBranch(offer.branchId) : undefined;
  if (!offer || !product || !branch) {
    return <Page title="가격 상세" backTo="/"><EmptyState title="가격 정보를 찾을 수 없어요"
      description="주소가 잘못되었거나 등록되지 않은 가격입니다." buttonLabel="상품 검색으로"
      onReset={() => router.replace('/')} /></Page>;
  }
  const brand = getBrand(branch.brandId);
  const status = getOfferStatus(offer);
  const effective = getEffectiveUnitPrice(offer);
  const compareHref = { pathname: '/products/[productId]' as const, params: { productId: product.id } };
  // 오래된 가격 주소로 들어와도 실제 비교에 쓰는 최신 기록과 포함 여부가 일치해야 한다.
  const included = getRegularComparisons(product.id).some((row) => row.offer?.id === offer.id && row.amount !== null);

  return (
    <Page title="가격 상세" backTo={compareHref}>
      <ScrollView contentContainerStyle={s.content}>
        <ProductHero product={product} />
        <View style={[s.card, styles.priceCard]}>
          <View style={s.wrap}>
            <Badge warm={offer.kind !== 'regular'}>{offerKindLabels[offer.kind]}</Badge>
            <Badge>{offer.channel === 'offline' ? '매장 가격' : '온라인 가격'}</Badge>
            {status !== 'available' ? <Badge warm>{offerStatusLabels[status]}</Badge> : null}
          </View>
          <Text style={s.body}>{status === 'expired' ? '종료된 행사 결제 금액' : status === 'upcoming' ? '예정 행사 결제 금액' : offer.channel === 'online' ? '상품 결제 금액 · 배송비 별도' : '실제 결제해야 할 금액'}</Text>
          <Text style={styles.amount}>{status === 'unknown' || offer.payAmount === null ? '가격 미확인' : formatWon(offer.payAmount)}</Text>
          <Text style={s.body}>{brand.name} · {branch.name}</Text>
          {status === 'expired' || status === 'upcoming' ? <Text style={styles.alert}>예시 기준 시각에 적용할 수 없는 행사입니다.</Text> : null}
          <View style={styles.quantityBox}>
            <DetailRow label="결제 수량" value={`상품 ${offer.payQuantity}개`} />
            <DetailRow label="받는 수량" value={`상품 ${offer.receiveQuantity}개 (총 ${offer.receiveQuantity * product.packCount}개입)`} />
            {effective !== null && status !== 'unknown' ? <DetailRow label="1개당 환산가" value={formatWon(effective)} /> : null}
          </View>
          <Text style={s.small}>상품 1개의 규격: {product.sizeLabel} × {product.packCount}개.{ '\n' }환산가는 참고용이며 위 결제 금액과 다를 수 있습니다.</Text>
        </View>
        <View>
          <SectionTitle title="가격 적용 조건" />
          <View style={[s.card, styles.sectionCard]}>
            <Text style={styles.condition}>{offer.condition}</Text>
            <Text style={s.small}>{included ? '조건 없는 매장 일반가로 최저가 비교에 포함됩니다.' : '이 가격은 매장 일반가 최저가 비교에서 제외됩니다.'}</Text>
            <DetailRow label="행사 시작" value={offer.startsAt ? formatDateTime(offer.startsAt) : '별도 행사 기간 없음'} />
            <DetailRow label="행사 종료" value={offer.endsAt ? formatDateTime(offer.endsAt) : '종료일 정보 없음'} />
          </View>
        </View>
        <View>
          <SectionTitle title="지점 및 확인 정보" />
          <View style={[s.card, styles.sectionCard]}>
            <DetailRow label="브랜드" value={brand.name} />
            <DetailRow label="지점" value={branch.name} />
            <DetailRow label="예시 지역" value={`대전광역시 ${branch.district} ${branch.area}`} />
            <DetailRow label="가격 확인 시각" value={`${formatDateTime(offer.observedAt)} (한국 시간)`} />
            <DetailRow label="재고 상태" value="미확인 · 가격 정보와 별개" />
          </View>
        </View>
        <View>
          <SectionTitle title="이 가격의 출처" />
          <View style={[s.card, styles.sectionCard]}>
            <Text style={styles.condition}>{offer.source.label}</Text>
            <Text style={s.body}>{offer.source.note}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button"
          onPress={() => {
            // 비교 화면에서 온 경우 기존 필터를 유지하고, 직접 진입했다면 해당 상품 비교를 연다.
            if (router.canGoBack()) router.back();
            else router.replace(compareHref);
          }}
          style={({ pressed }) => [s.button, pressed && s.pressed]}>
          <Text style={s.buttonText}>지점별 가격 비교로 돌아가기</Text>
        </Pressable>
        <DemoNotice />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  priceCard: { gap: 15, padding: 22 },
  amount: { color: palette.green, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  quantityBox: { borderRadius: 12, backgroundColor: palette.background, padding: 15, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 },
  label: { color: palette.muted, fontSize: 13, lineHeight: 21, flex: 0.8 },
  value: { color: palette.ink, fontSize: 13, lineHeight: 21, fontWeight: '600', textAlign: 'right', flex: 1.2 },
  alert: { color: palette.orange, fontSize: 13, lineHeight: 22 },
  sectionCard: { gap: 18 },
  condition: { color: palette.ink, fontSize: 15, fontWeight: '600', lineHeight: 25 },
});
