import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import { type PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateTime } from '@/features/prices/comparison';
import { DEMO_AS_OF } from '@/features/prices/demo-data';
import type { Product } from '@/features/prices/types';

export const palette = {
  background: '#F6F7F2', paper: '#FFFFFF', ink: '#173A31', muted: '#66766F',
  green: '#24634D', mint: '#EAF2E9', border: '#DEE5DA', orange: '#AA5429',
  peach: '#FFF1E5',
};

export function Page({ children, backTo, title }: PropsWithChildren<{ backTo?: Href; title?: string }>) {
  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.page}>
        <View style={s.header}>
          {backTo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 화면으로"
              onPress={() => {
                // 직접 주소로 들어온 화면에는 이전 기록이 없으므로 안전한 상위 화면으로 이동한다.
                if (router.canGoBack()) router.back();
                else router.replace(backTo);
              }}
              style={({ pressed }) => [s.back, pressed && s.pressed]}>
              <Text style={s.backText}>‹</Text>
            </Pressable>
          ) : <View style={s.logo}><Text style={s.logoText}>m.</Text></View>}
          <Text accessibilityRole="header" style={s.brand}>{title ?? '마트프라이스'}</Text>
          <View style={s.region}><Text style={s.regionText}>대전 · DEMO</Text></View>
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function DemoNotice() {
  return (
    <View style={s.demo}>
      <Text style={s.demoTitle}>직접 만든 예시 데이터</Text>
      <Text style={s.small}>지점·가격은 가상이며 실제 판매 정보가 아닙니다.</Text>
      <Text style={s.small}>비교 기준: {formatDateTime(DEMO_AS_OF)} (한국 시간)</Text>
    </View>
  );
}

export function Badge({ children, warm = false }: PropsWithChildren<{ warm?: boolean }>) {
  return <View style={[s.badge, warm && s.badgeWarm]}><Text style={[s.badgeText, warm && s.warmText]}>{children}</Text></View>;
}

function ProductPhoto({ uri, name }: { uri: string; name: string }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  if (state === 'failed') return <Text style={s.photoFallback}>사진을 불러올 수 없어요</Text>;
  return (
    <>
      <Image source={{ uri }} accessibilityLabel={`${name} 제품 사진`} contentFit="contain"
        style={s.photo} cachePolicy="memory-disk"
        onLoad={() => setState('loaded')} onError={() => setState('failed')} />
      {state === 'loading' ? <Text style={s.photoLoading}>사진 불러오는 중</Text> : null}
    </>
  );
}

export function ProductArt({ product, large = false, catalog = false }: { product: Product; large?: boolean; catalog?: boolean }) {
  // 사진은 제품 식별용이다. 낱개 대표 사진과 실제 비교하는 묶음 수량은 상품 규격에서 따로 안내한다.
  // URI를 key로 사용해 목록 재사용 시 이전 상품의 사진 실패 상태가 다음 상품에 남지 않게 한다.
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[s.productArt, large && s.productArtLarge, catalog && s.productArtCatalog]}>
      {product.image ? <ProductPhoto key={product.image.uri} uri={product.image.uri} name={product.name} />
        : <Text style={s.photoFallback}>사진 준비 중</Text>}
    </View>
  );
}

export function ProductHero({ product }: { product: Product }) {
  return (
    <View style={s.productHero}>
      <ProductArt product={product} large />
      <View style={s.flex}>
        <Text style={s.eyebrow}>{product.manufacturer} · {product.category}</Text>
        <Text accessibilityRole="header" style={s.title}>{product.name}</Text>
        <Text style={s.body}>{product.sizeLabel} × {product.packCount}개</Text>
        {product.image ? <Text style={s.small}>{product.image.note}</Text> : null}
      </View>
    </View>
  );
}

export function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <View style={s.sectionHeading}>
      <Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>
      {note ? <Text style={s.small}>{note}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, description, onReset, buttonLabel = '검색 초기화' }: {
  title: string; description: string; onReset?: () => void; buttonLabel?: string;
}) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>⌕</Text>
      <Text accessibilityRole="header" style={s.sectionTitle}>{title}</Text>
      <Text style={[s.body, s.center]}>{description}</Text>
      {onReset ? <Pressable accessibilityRole="button" onPress={onReset}
        style={({ pressed }) => [s.button, pressed && s.pressed]}>
        <Text style={s.buttonText}>{buttonLabel}</Text>
      </Pressable> : null}
    </View>
  );
}

export const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  page: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { minHeight: 76, paddingHorizontal: 22, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.green, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#FFF', fontSize: 25, fontWeight: '800', marginTop: -3 },
  brand: { color: palette.ink, fontSize: 18, fontWeight: '800', flex: 1 },
  region: { backgroundColor: palette.mint, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20 },
  regionText: { color: palette.green, fontSize: 11, fontWeight: '700' },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', marginLeft: -10 },
  backText: { color: palette.ink, fontSize: 36, lineHeight: 40 },
  content: { paddingHorizontal: 22, paddingBottom: 36, gap: 22 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pressed: { opacity: 0.65 },
  eyebrow: { color: palette.muted, fontSize: 12, fontWeight: '600', lineHeight: 19 },
  title: { color: palette.ink, fontSize: 24, fontWeight: '800', lineHeight: 34, marginVertical: 5 },
  body: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  small: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  strong: { color: palette.ink, fontWeight: '700' },
  center: { textAlign: 'center' },
  card: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, borderRadius: 20, padding: 18 },
  demo: { borderRadius: 14, backgroundColor: '#EBEEE5', padding: 14, gap: 3 },
  demoTitle: { fontSize: 12, color: palette.green, fontWeight: '700', marginBottom: 2 },
  badge: { backgroundColor: palette.mint, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start' },
  badgeText: { color: palette.green, fontWeight: '700', fontSize: 11 },
  badgeWarm: { backgroundColor: palette.peach },
  warmText: { color: palette.orange },
  productArt: { width: 64, height: 72, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 6 },
  productArtCatalog: { width: '100%', height: 154, borderRadius: 0, padding: 10 },
  photo: { width: '100%', height: '100%' },
  photoFallback: { color: palette.muted, fontSize: 11, textAlign: 'center', lineHeight: 18 },
  photoLoading: { position: 'absolute', bottom: 8, color: palette.muted, fontSize: 10, backgroundColor: '#FFFFFFDD' },
  productArtLarge: { width: 90, height: 112, borderRadius: 20 },
  emoji: { fontSize: 35 },
  largeEmoji: { fontSize: 49 },
  productHero: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 12 },
  sectionHeading: { gap: 5, marginBottom: 12 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800', lineHeight: 26 },
  button: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 13, backgroundColor: palette.green, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 12 },
  emptyIcon: { color: palette.green, fontSize: 44 },
  separator: { height: 12 },
  chip: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, justifyContent: 'center' },
  chipActive: { backgroundColor: palette.green, borderColor: palette.green },
  chipText: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  link: { color: palette.green, fontWeight: '700', fontSize: 13 },
});
