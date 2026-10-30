-- 두 번째: 테이블 생성 SQL이 성공한 뒤 이 파일 전체를 실행한다.
-- src/features/prices/{demo-data,product-catalog}.ts와 동일한 예시(2026-10-29 기준).
-- 지점·가격·행사는 가상이다. 실제 상품 사진의 출처는 가격 출처와 별도로 저장한다.
-- 다시 실행해도 기존 행을 수정하거나 중복 삽입하지 않는다.
begin;

-- 먼저 임시 테이블에서 데이터와 ID 충돌을 확인하고, 모두 통과한 경우에만 저장한다.
create temporary table mart_price_seed_brands (like public.brands including defaults) on commit drop;
create temporary table mart_price_seed_branches (like public.branches including defaults) on commit drop;
create temporary table mart_price_seed_products (like public.products including defaults) on commit drop;
create temporary table mart_price_seed_prices (like public.price_observations including defaults) on commit drop;

insert into mart_price_seed_brands (id, name, color) values
  ('emart', '이마트', '#936700'),
  ('homeplus', '홈플러스', '#C52D3A'),
  ('lotte', '롯데마트', '#BA2443'),
  ('everyday', '이마트에브리데이', '#786000'),
  ('express', '홈플러스 익스프레스', '#B12D32');

insert into mart_price_seed_branches (id, brand_id, name, city, district, area, is_demo) values
  ('emart-dunsan', 'emart', '둔산 예시점', '대전광역시', '서구', '둔산동', true),
  ('emart-yuseong', 'emart', '유성 예시점', '대전광역시', '유성구', '봉명동', true),
  ('homeplus-yuseong', 'homeplus', '유성 예시점', '대전광역시', '유성구', '궁동', true),
  ('lotte-seogu', 'lotte', '서구 예시점', '대전광역시', '서구', '관저동', true),
  ('everyday-daedeok', 'everyday', '대덕 예시점', '대전광역시', '대덕구', '송촌동', true),
  ('express-donggu', 'express', '동구 예시점', '대전광역시', '동구', '가오동', true);

-- 바코드는 확인되지 않았으므로 만들지 않는다. 사진이 없는 상품은 NULL을 유지한다.
insert into mart_price_seed_products
  (id, name, manufacturer, category, size_label, pack_count, emoji, keywords,
   image_url, image_source_url, image_note, is_demo) values
  ('milk-1l', '서울우유 흰우유', '서울우유', '유제품', '1L', 1, '🥛', array['우유', '흰 우유', '밀크', '1000ml'], null, null, null, true),
  ('ramyeon-5', '농심 신라면', '농심', '라면', '120g', 5, '🍜', array['라면', '봉지라면', '신라면5개', '신라면 5입'], 'https://www.nongshimshop.com/web/product/medium/202602/c21d28d05a2369f829df20601a00e0cf.jpg', 'https://www.nongshimshop.com/product/detail.html?product_no=2660&cate_no=61&display_group=1', '농심 공식몰 사진 · 5개입 포장', true),
  ('water-6', '제주삼다수', '제주특별자치도개발공사', '생수', '2L', 6, '💧', array['물', '생수', '삼다수', '2000ml', '6입'], null, null, null, true),
  ('rice-3', 'CJ 햇반', 'CJ제일제당', '간편식', '210g', 3, '🍚', array['밥', '즉석밥', '백미', '3입'], null, null, null, true),
  ('coffee-20', '맥심 모카골드 마일드', '동서식품', '커피', '12g', 20, '☕', array['커피믹스', '믹스커피', '스틱', '20입'], null, null, null, true),
  ('jin-ramyeon-5', '오뚜기 진라면 매운맛', '오뚜기', '라면', '120g', 5, '🍜', array['라면', '봉지라면', '진라면5개', '5입'], 'https://www.otoki.com/pds/brandGoods/2604/4f4a1b9a6bf94065b70e240b3b1fdbbd.png', 'https://www.otoki.com/product/otoki-brand-04', '낱개 대표 사진 · 비교 규격은 120g × 5개', true),
  ('milk-1_8l', '서울우유 흰우유', '서울우유', '유제품', '1.8L', 1, '🥛', array['우유', '흰 우유', '대용량', '1800ml'], null, null, null, true),
  ('ramyeon-1', '농심 신라면', '농심', '라면', '120g', 1, '🍜', array['라면', '봉지라면', '낱개', '신라면1개', '1입'], 'https://image.nongshim.com/non/pro/1734997151278.jpg', 'https://brand.nongshim.com/shinramyun/main/index?searchProdCode=26', '제조사 공식 사진 · 낱개 포장', true),
  ('jin-mild-1', '오뚜기 진라면 순한맛', '오뚜기', '라면', '120g', 1, '🍜', array['진라면', '봉지라면', '순한라면'], 'https://www.otoki.com/pds/brandGoods/2604/eba26efcdc7c4a51b8c89450b3e4315f.png', 'https://www.otoki.com/product/otoki-brand-04', '제조사 공식 사진 · 낱개 포장', true),
  ('samyang-1', '삼양라면', '삼양식품', '라면', '120g', 1, '🍜', array['삼양', '봉지라면'], 'https://www.samyangfoods.com/upload/product/20230912/20230912173938561416.jpg', 'https://www.samyangfoods.com/kor/brand/view.do?seq=530', '제조사 공식 사진 · 낱개 포장', true),
  ('buldak-1', '불닭볶음면', '삼양식품', '라면', '140g', 1, '🍜', array['불닭', '볶음라면', '매운라면'], 'https://www.samyangfoods.com/upload/product/20260622/20260622144950808477.png', 'https://www.samyangfoods.com/kor/brand/view.do?seq=53', '제조사 공식 사진 · 낱개 포장', true),
  ('carbo-buldak-1', '까르보불닭볶음면', '삼양식품', '라면', '130g', 1, '🍜', array['불닭', '까르보', '카르보', '볶음라면'], 'https://www.samyangfoods.com/upload/product/20260622/20260622145514434489.png', 'https://www.samyangfoods.com/kor/brand/view.do?seq=387', '제조사 공식 사진 · 낱개 포장', true),
  ('paldo-bibim-1', '팔도 비빔면', '팔도', '라면', '130g', 1, '🍜', array['비빔면', '비빔라면'], 'https://paldofood.co.kr/data/product/190231_234102_noodle-001.png', 'https://paldofood.co.kr/product/noodle/12', '제조사 공식 사진 · 낱개 포장', true),
  ('teumsae-1', '팔도 틈새라면', '팔도', '라면', '120g', 1, '🍜', array['틈새', '빨계떡', '오리지널', '매운라면'], 'https://paldofood.co.kr/data/product/132442_noodle-038.png', 'https://paldofood.co.kr/product/noodle/179', '제조사 공식 사진 · 낱개 포장', true);

-- 배열의 순서는 아래 branch_order와 같다. NULL도 '미확인' 관측으로 보존한다.
with branch_order (branch_id, brand_id, position) as (
  values
  ('emart-dunsan', 'emart', 1),
  ('emart-yuseong', 'emart', 2),
  ('homeplus-yuseong', 'homeplus', 3),
  ('lotte-seogu', 'lotte', 4),
  ('everyday-daedeok', 'everyday', 5),
  ('express-donggu', 'express', 6)
), regular_prices (product_id, amounts) as (
  values
  ('milk-1l', array[2980, 3080, 2890, 2780, 3150, null]::integer[]),
  ('ramyeon-5', array[4480, 4580, 4380, 4480, null, 4780]::integer[]),
  ('water-6', array[6480, 6980, 6580, 6480, 7200, null]::integer[]),
  ('rice-3', array[3980, 4180, 4280, 4080, 4380, null]::integer[]),
  ('coffee-20', array[3580, 3680, null, 3480, 3880, 3980]::integer[]),
  ('jin-ramyeon-5', array[3480, 3580, 3380, 3480, null, 3780]::integer[]),
  ('milk-1_8l', array[5380, 5480, 5280, 5180, null, 5680]::integer[]),
  ('ramyeon-1', array[950, 1000, 980, 990, 1100, null]::integer[]),
  ('jin-mild-1', array[850, 900, 880, 830, 950, null]::integer[]),
  ('samyang-1', array[950, 1000, 980, 930, 1050, 1080]::integer[]),
  ('buldak-1', array[1450, 1500, 1480, 1390, 1580, null]::integer[]),
  ('carbo-buldak-1', array[1680, 1750, 1690, 1650, null, 1800]::integer[]),
  ('paldo-bibim-1', array[1050, 1100, 1080, 990, 1180, 1200]::integer[]),
  ('teumsae-1', array[1180, 1250, 1200, 1150, 1290, null]::integer[])
)
insert into mart_price_seed_prices
  (id, product_id, brand_id, branch_id, channel, kind, pay_amount, pay_quantity,
   receive_quantity, condition, observed_at, source_label, source_note, is_demo)
select r.product_id || '-' || b.branch_id || '-regular', r.product_id, b.brand_id,
  b.branch_id, 'offline', 'regular', r.amounts[b.position], 1, 1,
  '회원가입·특정 카드·추가 구매 조건 없는 상품 한 묶음 가격',
  '2026-10-29T10:00:00+09:00'::timestamptz,
  '직접 만든 예시 데이터',
  '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.', true
from regular_prices r cross join branch_order b;

-- 회원·카드·1+1·온라인·종료 행사 5건은 일반 매장 최저가와 분리한다.
insert into mart_price_seed_prices
  (id, product_id, brand_id, branch_id, channel, kind, pay_amount, pay_quantity,
   receive_quantity, condition, observed_at, starts_at, ends_at, source_label, source_note, is_demo) values
  ('milk-member', 'milk-1l', 'emart', 'emart-dunsan', 'offline', 'member', 2580, 1, 1, '예시 멤버십 회원 인증 시 적용 · 다른 할인과 중복 불가', '2026-10-29T10:30:00+09:00', '2026-10-26T00:00:00+09:00', '2026-11-01T23:59:59+09:00', '직접 만든 예시 데이터', '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.', true),
  ('milk-card', 'milk-1l', 'homeplus', 'homeplus-yuseong', 'offline', 'card', 2480, 1, 1, '예시 행사 카드로 결제 시 적용 · 다른 할인과 중복 불가', '2026-10-29T10:30:00+09:00', '2026-10-26T00:00:00+09:00', '2026-11-01T23:59:59+09:00', '직접 만든 예시 데이터', '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.', true),
  ('milk-bundle', 'milk-1l', 'everyday', 'everyday-daedeok', 'offline', 'bundle', 3300, 1, 2, '1+1 예시 행사 · 1개 가격을 결제하고 같은 1L 상품 2개 수령', '2026-10-29T10:30:00+09:00', '2026-10-26T00:00:00+09:00', '2026-11-01T23:59:59+09:00', '직접 만든 예시 데이터', '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.', true),
  ('milk-online', 'milk-1l', 'lotte', 'lotte-seogu', 'online', 'regular', 2380, 1, 1, '온라인 전용 예시 가격 · 배송비 별도, 매장 가격과 비교하지 않음', '2026-10-29T10:30:00+09:00', '2026-10-26T00:00:00+09:00', '2026-11-01T23:59:59+09:00', '직접 만든 예시 데이터', '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.', true),
  ('milk-expired', 'milk-1l', 'express', 'express-donggu', 'offline', 'member', 1980, 1, 1, '종료된 예시 회원 행사 · 현재 적용 불가', '2026-10-26T09:00:00+09:00', '2026-10-20T00:00:00+09:00', '2026-10-27T23:59:59+09:00', '직접 만든 예시 데이터', '화면과 비교 규칙을 시험하기 위한 가상 가격입니다. 실제 매장·전단·온라인몰에서 수집한 정보가 아닙니다.', true);

-- 실제 데이터가 같은 ID를 사용 중이면 예시와 연결하지 않고 전체 입력을 취소한다.
do $seed_guard$
begin
  if exists (
    select 1 from public.brands d join mart_price_seed_brands s using (id) where d.name <> s.name
  ) then
    raise exception '예시 마트 ID가 다른 브랜드와 겹칩니다. 기존 데이터를 확인하세요.';
  end if;
  if exists (
    select 1 from public.branches d join mart_price_seed_branches s using (id) where not d.is_demo
    union all
    select 1 from public.products d join mart_price_seed_products s using (id) where not d.is_demo
    union all
    select 1 from public.price_observations d join mart_price_seed_prices s using (id) where not d.is_demo
  ) then
    raise exception '예시 ID가 기존 실제 데이터와 겹칩니다. 실제 행을 삭제하거나 예시로 바꾸지 말고 ID를 검토하세요.';
  end if;
end;
$seed_guard$;

-- 충돌한 예시 행도 덮어쓰지 않는다. 수동 편집한 예시를 초기화하는 스크립트가 아니다.
insert into public.brands (id, name, color)
select id, name, color from mart_price_seed_brands on conflict (id) do nothing;

insert into public.branches (id, brand_id, name, city, district, area, is_demo)
select id, brand_id, name, city, district, area, is_demo from mart_price_seed_branches on conflict (id) do nothing;

insert into public.products
  (id, name, manufacturer, category, size_label, pack_count, emoji, keywords,
   image_url, image_source_url, image_note, is_demo)
select id, name, manufacturer, category, size_label, pack_count, emoji, keywords,
  image_url, image_source_url, image_note, is_demo from mart_price_seed_products on conflict (id) do nothing;

insert into public.price_observations
  (id, product_id, brand_id, branch_id, channel, kind, pay_amount, pay_quantity,
   receive_quantity, condition, observed_at, starts_at, ends_at, source_label, source_note, is_demo)
select id, product_id, brand_id, branch_id, channel, kind, pay_amount, pay_quantity,
  receive_quantity, condition, observed_at, starts_at, ends_at, source_label, source_note, is_demo
from mart_price_seed_prices on conflict (id) do nothing;

commit;
