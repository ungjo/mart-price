-- Supabase SQL Editor에서 postgres 역할로 이 파일 전체를 한 번 실행한다.
-- 최초 스키마 생성용이다. 같은 이름의 테이블이 있으면 덮어쓰지 않고 실패한다.
-- 중간 오류가 나면 전체 트랜잭션이 취소되어 일부 테이블만 남지 않는다.
begin;

create table public.brands (
  id text primary key default gen_random_uuid()::text check (btrim(id) <> ''),
  name text not null unique check (btrim(name) <> ''),
  color text not null default '#475569' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

create table public.branches (
  id text primary key default gen_random_uuid()::text check (btrim(id) <> ''),
  brand_id text not null references public.brands(id),
  name text not null check (btrim(name) <> ''),
  city text not null check (btrim(city) <> ''),
  district text not null check (btrim(district) <> ''),
  area text not null check (btrim(area) <> ''),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  -- 가격의 브랜드와 지점 소속이 일치하는지 복합 외래 키로 검증한다.
  unique (id, brand_id)
);

create table public.products (
  id text primary key default gen_random_uuid()::text check (btrim(id) <> ''),
  name text not null check (btrim(name) <> ''),
  manufacturer text not null check (btrim(manufacturer) <> ''),
  category text not null check (btrim(category) <> ''),
  size_label text not null check (btrim(size_label) <> ''),
  pack_count integer not null check (pack_count > 0),
  barcode text check (btrim(barcode) <> ''),
  emoji text not null default '🛒',
  keywords text[] not null default '{}',
  image_url text,
  image_source_url text,
  image_note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  -- 사진이 없는 상품도 허용하지만, 사진이 있으면 원문 출처와 설명을 함께 남긴다.
  constraint product_image_has_source check (
    (image_url is null and image_source_url is null and image_note is null)
    or (image_url is not null and image_source_url is not null and image_note is not null
      and image_url ~ '^https://' and image_source_url ~ '^https://'
      and btrim(image_note) <> '')
  )
);

create table public.price_observations (
  id text primary key default gen_random_uuid()::text check (btrim(id) <> ''),
  product_id text not null references public.products(id),
  brand_id text not null references public.brands(id),
  -- 온라인몰 가격에는 특정 매장 정보가 없을 수 있으므로 지점은 NULL을 허용한다.
  branch_id text,
  channel text not null check (channel in ('offline', 'online')),
  kind text not null check (kind in ('regular', 'member', 'card', 'bundle')),
  -- NULL은 미확인이다. 알 수 없는 가격을 0원으로 저장하지 않는다.
  pay_amount integer check (pay_amount > 0),
  currency text not null default 'KRW' check (currency = 'KRW'),
  -- 상품 한 묶음 기준 수량이다. 5개입 라면의 receive_quantity=2는 낱개 10개다.
  pay_quantity integer not null default 1 check (pay_quantity > 0),
  receive_quantity integer not null default 1 check (receive_quantity >= pay_quantity),
  condition text not null default '',
  observed_at timestamptz not null,
  starts_at timestamptz,
  ends_at timestamptz,
  source_label text not null check (btrim(source_label) <> ''),
  source_note text not null check (btrim(source_note) <> ''),
  source_url text check (source_url ~ '^https?://'),
  -- 가격을 확인했다는 이유만으로 재고가 있다고 표시하지 않는다.
  stock text not null default 'unknown' check (stock = 'unknown'),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  constraint price_branch_matches_brand foreign key (branch_id, brand_id)
    references public.branches(id, brand_id),
  constraint offline_price_needs_branch check (channel <> 'offline' or branch_id is not null),
  constraint promotion_dates_are_ordered check (
    starts_at is null or ends_at is null or starts_at <= ends_at
  )
);

comment on table public.brands is '비교 대상 마트 브랜드. 지점·가격 예시 여부와 별도로 공유하는 기준 정보.';
comment on table public.branches is '마트 지점. is_demo=true는 실제 매장이 아닌 테스트용 지점.';
comment on table public.products is '용량·묶음 수가 다르면 별도 상품 ID를 사용하는 상품 카탈로그.';
comment on table public.price_observations is '상품별 가격 관측 이력. 새 관측은 새 ID로 INSERT하고 과거 기록을 덮어쓰지 않는다.';
comment on column public.products.pack_count is '한 상품에 들어 있는 낱개 수. 행사에서 받는 묶음 수와 구분.';
comment on column public.price_observations.pay_amount is '실제로 결제하는 원화 금액. NULL은 가격 미확인.';
comment on column public.price_observations.observed_at is '가격을 확인한 시각. 저장 시각(created_at)과 구분.';
comment on column public.price_observations.is_demo is '실제 가격 조회에는 false, 예시 화면에는 true만 사용하여 혼합을 방지.';
comment on column public.price_observations.source_note is '앱에서 공개할 출처 설명만 저장. API 키·인증 헤더·원본 비공개 응답은 저장하지 않는다.';

create index branches_brand_city_idx on public.branches (brand_id, city);
create index products_category_idx on public.products (category);
-- 상품·지점별 최신 관측을 먼저 선택한 뒤 금액·기간·조건을 검증해야 한다.
-- 최신 가격이 미확인이거나 종료되었다고 과거의 싼 가격으로 되돌아가지 않는다.
create index price_observations_latest_idx on public.price_observations
  (product_id, is_demo, channel, kind, branch_id, observed_at desc, created_at desc, id desc);
create index price_observations_branch_brand_idx on public.price_observations (branch_id, brand_id);
create index price_observations_brand_idx on public.price_observations (brand_id);

-- 아래 네 테이블은 공개 카탈로그와 가격 정보 전용이다. 개인 정보는 별도 테이블에 둔다.
-- 권한과 RLS를 함께 제한하므로 앱의 공개 키로는 읽기만 가능하다.
alter table public.brands enable row level security;
alter table public.branches enable row level security;
alter table public.products enable row level security;
alter table public.price_observations enable row level security;

revoke all on table public.brands, public.branches, public.products, public.price_observations
  from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on table public.brands, public.branches, public.products, public.price_observations
  to anon, authenticated;
-- 관리용 서버에서만 쓰는 역할이다. 해당 키를 모바일 앱에 넣지 않는다.
grant select, insert, update, delete on table public.brands, public.branches, public.products, public.price_observations
  to service_role;

create policy brands_public_read on public.brands
  for select to anon, authenticated using (true);
create policy branches_public_read on public.branches
  for select to anon, authenticated using (true);
create policy products_public_read on public.products
  for select to anon, authenticated using (true);
create policy price_observations_public_read on public.price_observations
  for select to anon, authenticated using (true);

commit;
