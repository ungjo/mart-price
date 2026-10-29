import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandPriceSummary } from '@/components/prices/brand-price-summary';
import { OfferCard } from '@/components/prices/offer-card';
import { Badge, DemoNotice, EmptyState, Page, ProductHero, SectionTitle, palette, s } from '@/components/prices/ui';
import { formatWon, getBrand, getBranch, getProduct, getProductOffers, getRegularComparisons } from '@/features/prices/comparison';
import { brands } from '@/features/prices/demo-data';
import type { BrandId } from '@/features/prices/types';

export default function ComparisonScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [brandId, setBrandId] = useState<BrandId | undefined>();
  const product = getProduct(typeof productId === 'string' ? productId : '');
  if (!product) {
    return <Page title="상품 비교" backTo="/"><EmptyState title="상품을 찾을 수 없어요"
      description="주소가 잘못되었거나 등록되지 않은 상품입니다." buttonLabel="상품 검색으로"
      onReset={() => router.replace('/')} /></Page>;
  }

  const rows = getRegularComparisons(product.id, brandId);
  const knownRows = rows.filter((row) => row.amount !== null);
  const lowest = knownRows[0]?.amount ?? null;
  const highest = knownRows.at(-1)?.amount ?? null;
  const selectedOffers = getProductOffers(product.id).filter((offer) =>
    !brandId || getBranch(offer.branchId)?.brandId === brandId);
  // 조건부 할인과 온라인가는 일반 매장가 순위 밖에 둔다. 싼 숫자만 섞으면 구매 조건을 오해할 수 있다.
  const conditionalOffers = selectedOffers.filter((offer) => offer.channel === 'offline' && offer.kind !== 'regular');
  const onlineOffers = selectedOffers.filter((offer) => offer.channel === 'online');

  return (
    <Page title="지점별 가격 비교" backTo="/">
      <ScrollView contentContainerStyle={s.content}>
        <ProductHero product={product} />
        <BrandPriceSummary productId={product.id} />
        <View style={styles.summary}>
          <View style={s.wrap}><Badge>일반 매장가</Badge><Text style={styles.summaryLabel}>선택한 지점 중 최저가</Text></View>
          <Text style={styles.lowest}>{lowest === null ? '확인된 가격 없음' : formatWon(lowest)}</Text>
          <Text style={styles.summaryNote}>{knownRows.length}개 지점 가격 확인 · 동일 상품 {product.packCount}개입 기준</Text>
          {lowest !== null && highest !== null && highest > lowest ? (
            <Text style={styles.saving}>지점에 따라 최대 {formatWon(highest - lowest)} 차이</Text>
          ) : null}
        </View>
        <View>
          <SectionTitle title="브랜드 선택" note="브랜드와 지점을 구분해 비교해요." />
          <ScrollView horizontal accessibilityRole="radiogroup" accessibilityLabel="브랜드 선택" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ id: undefined, name: '전체' }, ...brands].map((brand) => (
              <Pressable key={brand.id ?? 'all'} accessibilityRole="radio"
                aria-checked={brandId === brand.id} onPress={() => setBrandId(brand.id)}
                style={[s.chip, brandId === brand.id && s.chipActive]}>
                <Text style={[s.chipText, brandId === brand.id && s.chipTextActive]}>{brand.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View>
          <SectionTitle title={`매장 일반가 · ${rows.length}개 지점`} note="낮은 가격순 · 회원·카드·추가 구매 조건 제외" />
          <View style={styles.list}>
            {rows.map((row) => row.offer ? <OfferCard key={row.branch.id} offer={row.offer} isLowest={row.isLowest} /> : (
              <View key={row.branch.id} style={s.card}>
                <Text style={s.sectionTitle}>{getBrand(row.branch.brandId).name} {row.branch.name}</Text>
                <Text style={s.body}>가격 미확인 · 최저가 비교에서 제외</Text>
              </View>
            ))}
          </View>
          {knownRows.length === 0 ? <Text style={styles.unknown}>선택한 브랜드에 비교 가능한 일반 매장가가 없습니다.</Text> : null}
        </View>
        <View>
          <SectionTitle title="조건부 혜택" note="회원·카드·묶음 조건을 확인하세요. 일반가 순위와 별개예요." />
          <View style={styles.list}>
            {conditionalOffers.length ? conditionalOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />) : (
              <Text style={s.body}>등록된 조건부 혜택이 없습니다.</Text>
            )}
          </View>
        </View>
        <View>
          <SectionTitle title="온라인 가격" note="매장가와 별도 표시 · 배송비를 포함한 총액이 아닙니다." />
          <View style={styles.list}>
            {onlineOffers.length ? onlineOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />) : (
              <Text style={s.body}>등록된 온라인 가격이 없습니다.</Text>
            )}
          </View>
        </View>
        <Text style={s.small}>가격 미확인·종료·예정 가격은 최저가 계산에서 제외됩니다. 가격이 있어도 재고가 확인된 것은 아닙니다.</Text>
        <DemoNotice />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: palette.ink, borderRadius: 22, padding: 23, gap: 12 },
  summaryLabel: { color: '#D5E5DA', fontSize: 12, alignSelf: 'center' },
  lowest: { color: '#FFF', fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  summaryNote: { color: '#D5E5DA', fontSize: 13, lineHeight: 21 },
  saving: { color: '#E8E6AE', fontSize: 13, fontWeight: '600' },
  chips: { gap: 8 },
  list: { gap: 12 },
  unknown: { color: palette.orange, fontSize: 13, lineHeight: 22, paddingTop: 12 },
});
