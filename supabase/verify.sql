-- 세 번째: 새 프로젝트에 schema와 seed를 넣은 직후 실행한다.
-- 데이터를 수정하지 않는다. 결과의 모든 passed가 true면 초기 데이터/읽기 권한이 정상이다.
-- 추후 상품을 추가하거나 예시를 편집하면 아래 고정 건수 검사는 달라질 수 있다.
begin read only;
-- 관리자 조회만 성공하는 문제를 피하기 위해 로그인하지 않은 앱 사용자 권한으로 읽는다.
set local role anon;

with latest_milk as (
  select distinct on (branch_id) *
  from public.price_observations
  where product_id = 'milk-1l' and is_demo
    and channel = 'offline' and kind = 'regular'
  order by branch_id, observed_at desc, created_at desc, id desc
), comparable_milk as (
  -- 최신 행을 고른 뒤에만 유효 기간·금액·수량을 검사한다.
  select case
    when observed_at <= '2026-10-29T12:00:00+09:00'::timestamptz
      and pay_quantity = 1 and receive_quantity = 1 and pay_amount > 0
      and (starts_at is null or starts_at <= '2026-10-29T12:00:00+09:00'::timestamptz)
      and (ends_at is null or ends_at >= '2026-10-29T12:00:00+09:00'::timestamptz)
    then pay_amount else null end as amount
  from latest_milk
), protected_tables as (
  select c.oid, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('brands', 'branches', 'products', 'price_observations')
), checks (check_name, expected, actual) as (
  select '마트 브랜드', 5::bigint, count(*) from public.brands
  union all select '대전 가상 지점', 6, count(*) from public.branches where is_demo and city = '대전광역시'
  union all select '예시 상품', 14, count(*) from public.products where is_demo
  union all select '라면 검색 결과', 9, count(*) from public.products where is_demo and (name ilike '%라면%' or category = '라면' or '라면' = any(keywords))
  union all select '사진이 있는 상품', 9, count(*) from public.products where is_demo and image_url is not null
  union all select '예시 가격 기록', 89, count(*) from public.price_observations where is_demo
  union all select '미확인 가격', 12, count(*) from public.price_observations where is_demo and pay_amount is null
  union all select '우유 1L 일반 매장 최저가(원)', 2780, min(amount) from comparable_milk
  union all select 'RLS를 활성화한 테이블', 4, count(*) from protected_tables where relrowsecurity
  union all select '공개/로그인 역할의 읽기 권한', 8, count(*)
    from protected_tables t cross join (values ('anon'), ('authenticated')) as roles(role_name)
    where has_table_privilege(roles.role_name, t.oid, 'SELECT')
  union all select '공개/로그인 역할의 쓰기 권한(0이어야 함)', 0, count(*)
    from protected_tables t cross join (values ('anon'), ('authenticated')) as roles(role_name)
    where has_table_privilege(roles.role_name, t.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
)
select check_name, expected, actual, coalesce(expected = actual, false) as passed
from checks order by check_name;

commit;
