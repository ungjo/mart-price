import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DemoNotice, EmptyState, Page, ProductArt, palette, s } from '@/components/prices/ui';
import { searchProducts } from '@/features/prices/comparison';
import { brands } from '@/features/prices/demo-data';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; maker?: string }>();
  // 첫 화면에서 정해진 상품을 고르게 하지 않는다. 자유 검색어를 입력했을 때만 카탈로그를 조회한다.
  // 검색 조건은 주소에 보존해 가격 상세에서 돌아오거나 새로고침해도 같은 결과를 볼 수 있다.
  const query = typeof params.q === 'string' ? params.q : '';
  const [draft, setDraft] = useState(query);
  const hasQuery = query.trim().length > 0;
  const matchedProducts = hasQuery ? searchProducts(query) : [];
  const makers = [...new Set(matchedProducts.map((product) => product.manufacturer))];
  const maker = typeof params.maker === 'string' && makers.includes(params.maker) ? params.maker : '';
  const results = maker ? matchedProducts.filter((product) => product.manufacturer === maker) : matchedProducts;
  const resetSearch = () => {
    setDraft('');
    router.setParams({ q: '', maker: '' });
  };
  const submitSearch = () => {
    router.setParams({ q: draft.trim(), maker: '' });
    Keyboard.dismiss();
  };

  return (
    <Page>
      <FlatList
        data={results}
        numColumns={2}
        keyExtractor={(product) => product.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.columns}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListHeaderComponent={
          <View style={styles.intro}>
            <View>
              <Text style={styles.kicker}>상품을 찾고, 마트 가격을 비교하세요</Text>
              <Text accessibilityRole="header" style={styles.headline}>무엇을 찾으세요?</Text>
              <Text style={s.body}>‘라면’을 검색하고, 원하는 라면을 골라보세요.</Text>
            </View>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel="상품 검색"
                placeholder="라면, 우유, 생수 등 자유롭게 검색"
                placeholderTextColor={palette.muted}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={submitSearch}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.input}
              />
              {draft ? <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기"
                onPress={resetSearch} style={styles.clear}><Text style={s.body}>✕</Text></Pressable> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="검색 실행"
                onPress={submitSearch} style={styles.searchButton}>
                <Text style={styles.searchButtonText}>검색</Text>
              </Pressable>
            </View>
            <Text style={styles.demoLabel}>예시 카탈로그 · 판매가격은 아직 실제 마트와 연동되지 않았습니다.</Text>
            {hasQuery ? (
              <View style={styles.resultHeader}>
                <View style={styles.resultsHeading}>
                  <Text accessibilityRole="header" style={s.sectionTitle}>‘{query.trim()}’ 검색 결과</Text>
                  <Text accessibilityLiveRegion="polite" style={s.small}>{results.length}개 상품</Text>
                </View>
                {makers.length > 1 ? (
                  <ScrollView horizontal accessibilityRole="radiogroup" accessibilityLabel="제조사 선택"
                    showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}
                    keyboardShouldPersistTaps="handled">
                    {['', ...makers].map((item) => (
                      <Pressable key={item || 'all'} accessibilityRole="radio" aria-checked={maker === item}
                        onPress={() => router.setParams({ maker: item })}
                        style={[s.chip, maker === item && s.chipActive]}>
                        <Text style={[s.chipText, maker === item && s.chipTextActive]}>{item || '전체 제조사'}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                <Text style={s.small}>상품을 선택하면 5개 마트의 가격을 확인할 수 있어요.</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button"
            accessibilityLabel={`${item.manufacturer} ${item.name}, ${item.sizeLabel} ${item.packCount}개, 5개 마트 가격 비교`}
            onPress={() => {
              Keyboard.dismiss();
              router.push({ pathname: '/products/[productId]', params: { productId: item.id } });
            }}
            style={({ pressed }) => [styles.productCard, pressed && s.pressed]}>
            <ProductArt product={item} catalog />
            <View style={styles.productInfo}>
              <Text style={s.eyebrow}>{item.manufacturer}</Text>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.small}>{item.sizeLabel} × {item.packCount}개</Text>
              <Text style={styles.compareLink}>5개 마트 가격 보기 ›</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={hasQuery ? (
          <EmptyState title="일치하는 상품이 없어요"
            description="현재 예시 카탈로그에 없는 상품입니다. 다른 검색어를 입력해 보세요."
            onReset={resetSearch} buttonLabel="검색어 지우기" />
        ) : (
          <View style={styles.start}>
            <Text style={styles.startIcon}>⌕</Text>
            <Text accessibilityRole="header" style={s.sectionTitle}>찾고 싶은 상품을 검색하세요</Text>
            <Text style={[s.body, s.center]}>품목명이나 제품명을 자유롭게 입력하세요.{ '\n' }여러 제조사의 상품을 사진으로 확인할 수 있어요.</Text>
            <View style={styles.steps}>
              <Text style={styles.step}>01  상품 검색</Text>
              <Text style={styles.step}>02  사진으로 상품 선택</Text>
              <Text style={styles.step}>03  5개 마트 가격 비교</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={s.eyebrow}>비교하는 마트</Text>
            <Text style={styles.brands}>{brands.map((brand) => brand.name).join(' · ')}</Text>
            <DemoNotice />
          </View>
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  columns: { gap: 12 },
  intro: { gap: 19, marginBottom: 20 },
  kicker: { color: palette.green, fontSize: 12, fontWeight: '700', marginTop: 15, marginBottom: 12 },
  headline: { color: palette.ink, fontSize: 32, fontWeight: '800', lineHeight: 43, letterSpacing: -1, marginBottom: 10 },
  searchBox: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: palette.green, borderRadius: 16, minHeight: 58, paddingLeft: 12, paddingRight: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  searchIcon: { fontSize: 28, color: palette.green },
  input: { flex: 1, minWidth: 0, fontSize: 14, color: palette.ink, paddingVertical: 15 },
  clear: { minWidth: 30, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  searchButton: { minHeight: 44, paddingHorizontal: 13, justifyContent: 'center', backgroundColor: palette.green, borderRadius: 11 },
  searchButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  demoLabel: { fontSize: 12, lineHeight: 20, color: palette.orange },
  resultHeader: { gap: 14 },
  chips: { gap: 8 },
  brands: { fontSize: 12, color: palette.muted, lineHeight: 22 },
  resultsHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  productCard: { flex: 1, maxWidth: '49%', backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
  productInfo: { padding: 13, gap: 5 },
  productName: { color: palette.ink, fontSize: 16, lineHeight: 23, fontWeight: '700', minHeight: 46 },
  compareLink: { borderTopWidth: 1, borderTopColor: palette.border, marginTop: 7, paddingTop: 12, color: palette.green, fontSize: 12, fontWeight: '700' },
  start: { alignItems: 'center', paddingVertical: 25, gap: 15 },
  startIcon: { color: palette.green, fontSize: 64 },
  steps: { marginTop: 15, gap: 15, alignSelf: 'stretch', padding: 22, backgroundColor: palette.mint, borderRadius: 18 },
  step: { color: palette.green, fontSize: 14, fontWeight: '600' },
  footer: { marginTop: 30, gap: 12 },
});
