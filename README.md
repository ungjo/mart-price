# 마트프라이스 · 대전 데모

같은 제조사·상품·용량·묶음 수량의 가격을 브랜드와 지점별로 비교하는 Expo / React Native 앱입니다.
전국 서비스가 목표이며, 현재 앱은 **Supabase에 저장된 대전시 예시 상품·지점·가격**을 조회합니다. 실행 전 아래 공개 연결 정보 설정이 필요합니다.

## 구현한 화면

1. **상품 검색**: 자유 검색어 입력 → 제조사별 사진 결과 → 상품 선택. 검색 전에는 정해진 품목을 나열하지 않습니다.
2. **지점별 비교**: 5개 마트 가격 요약, 브랜드 필터, 일반 매장가 오름차순, 동률 최저가, 미확인 가격, 조건부 혜택과 온라인가 별도 표시.
3. **가격 상세**: 결제 금액, 결제·수령 수량, 환산가, 적용 조건, 행사 기간, 가격 확인 시각, 출처와 재고 미확인 표시.

검색 조건은 주소에 저장합니다. 비교·상세 화면은 Expo Router 스택으로 연결해 돌아갈 때 이전 화면 상태를 유지합니다.
없는 상품·가격 ID나 잘못된 주소에는 검색 화면으로 돌아가는 안내를 제공합니다.
초기 템플릿의 `/explore` 주소도 검색 화면으로 연결합니다.

## 예시 데이터 범위

- 브랜드: 이마트, 홈플러스, 롯데마트, 이마트에브리데이, 홈플러스 익스프레스
- 가상 지점 6곳: 같은 이마트 브랜드의 지점 2곳을 포함해 지점 간 차이도 표시
- 규격별 상품 14개: 라면 9개 규격과 우유·생수·즉석밥·커피
- 비교 기준 시각: **2026-10-29 12:00, 한국 시간**
- 지점명·가격·행사는 직접 만든 테스트용 정보입니다. 실제 매장의 존재·영업·재고·판매가격을 의미하지 않습니다.
- 날짜가 지나도 데모를 재현하도록 기준 시각을 고정했습니다. 실제 수집 데이터를 연결할 때 현재 시각과 가격 유효성 정책으로 교체해야 합니다.
- Supabase의 상품 검색·지점별 가격 비교·가격 상세 조회를 연결했습니다. 로그인, 실제 마트 가격 수집, 위치 권한, 지도, 앱 스토어 배포는 아직 구현하지 않았습니다.

## 가격 비교 규칙

- 상품 ID는 제조사·제품·용량·묶음 수량이 같은 판매 규격 하나를 식별합니다.
- 일반 매장가는 결제 수량과 수령 수량이 모두 상품 1개인, 조건 없는 오프라인 가격만 비교합니다.
- 회원·카드·묶음 할인과 온라인가는 별도로 표시합니다. 온라인 상품가는 배송비를 포함하지 않습니다.
- 1+1은 총 결제 금액과 수령 수량을 먼저 표시하고 환산가는 참고값으로 구분합니다.
- 상품 한 개는 판매 규격 한 묶음입니다. 예를 들어 5개입 라면 두 묶음을 받으면 총 낱개 10개입니다.
- 미확인·0 이하·비정상 가격, 종료·예정 행사, 잘못된 날짜와 미래 관측은 최저가에서 제외합니다.
- 한 지점에 여러 일반가 기록이 있으면 최신 기록을 먼저 선택합니다. 새 기록이 미확인이어도 과거 싼 가격으로 되돌아가지 않습니다.
- 브랜드 필터를 적용하면 선택된 지점 범위에서 최저가를 계산하며, 동률은 모두 최저가로 표시합니다.
- 가격 관측은 재고 확인과 별개입니다. 모든 예시 재고 상태는 미확인입니다.

## 실행과 검사

**package.json이 있는 mart-price 폴더**에서 실행합니다. 상위 workspace에서는 실행하지 않습니다.

PowerShell:

```powershell
cd C:\juj\AI_automatize\Price_comparison\workspace\mart-price
npm.cmd run web
```

휴대폰 또는 에뮬레이터에서 확인하려면 `npm.cmd start`를 실행하고 Expo 터미널 안내에 따라 연결합니다.
웹 미리보기는 모바일 화면 폭에서도 확인할 수 있지만 Android/iOS 기기 실행을 대신하지 않습니다.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

- `typecheck`: TypeScript 타입 검사
- `lint`: Expo ESLint 규칙 검사
- `test`: 가격 비교·검색·행사·수량·시간대와 Supabase 조회 계층의 자동 테스트 30개
- 테스트 실행기는 TypeScript 모듈을 임시 폴더에 변환하고 Node 내장 테스트를 실행합니다. 조회 계층에는 mock 클라이언트를 주입하므로 실제 Supabase 키나 DB 변경 없이 검사합니다.
- 라우트를 새로 추가한 뒤 경로 타입이 오래되었다는 오류가 나면 `npm.cmd start`로 Expo Router의 경로 타입을 재생성한 뒤 타입 검사를 다시 실행합니다. `.expo`는 생성 파일이므로 커밋하지 않습니다.
- 웹 번들 확인: `npx.cmd expo export --platform web`. 결과물 `dist`는 커밋하지 않습니다.
- Git Bash에서는 위 명령의 `npm.cmd`를 `npm`, `npx.cmd`를 `npx`로 써도 됩니다.

2026-10-29 원격 연결 검증: 공개 키로 상품 14개·마트 5개·지점 6개·가격 89개를 읽었으며, 브라우저에서 라면 9개 검색 → 제조사 필터 → 신라면 5개입의 5개 마트 비교 → 가격 상세(4,380원)를 확인했습니다. 실제 DB 쓰기 작업은 하지 않았습니다. Android/iOS는 번들 생성만 검증했으며 기기 실행은 별도 확인이 필요합니다.

## 주요 코드 위치

| 위치 | 역할 |
| --- | --- |
| `src/features/prices/types.ts` | 상품 규격, 브랜드, 지점, 가격 관측 타입 |
| `src/features/prices/product-catalog.ts` | 테스트와 SQL seed의 기준이 되는 카탈로그. 앱 실행 중 조회에는 사용하지 않음 |
| `src/features/prices/brand-summary.ts` | 5개 마트별 요약 가격 |
| `src/features/prices/demo-data.ts` | 자동 테스트용 대전 예시 데이터 |
| `src/features/prices/scope.ts` | 대전·예시 데이터 조회 범위와 고정 비교 시각 |
| `src/lib/supabase.ts` | 공개 키 기반 Supabase 클라이언트 |
| `src/features/prices/repository.ts` | DB 상품·지점·가격 조회, 페이지 이동과 요청 취소 |
| `src/features/prices/row-mappers.ts` | DB 컬럼을 화면 모델로 변환 |
| `src/features/prices/database-types.ts` | 초기 SQL 스키마와 일치하는 DB 타입 |
| `src/hooks/use-remote-resource.ts` | 로딩·재시도·20초 시간 제한·이전 응답 차단 |
| `src/features/prices/comparison.ts` | 검색, 최신 기록 선택, 비교, 상태 판정, 금액·시각 표시 |
| `src/app/index.tsx` | 상품 검색 |
| `src/app/products/[productId].tsx` | 지점별 비교 |
| `src/app/prices/[offerId].tsx` | 가격 상세 |
| `src/components/prices/` | 화면 틀, 상품 표시, 가격 카드 |
| `scripts/prices.test.cjs` | 가격 비교 규칙 회귀 검사 |

핵심 계산과 화면 이동의 전제·이유는 한국어 주석으로 설명합니다. 앞으로도 `AGENTS.md`의 주석 기준을 적용합니다.
첫 데모 화면은 밝은 색상으로 통일했습니다. 기존 템플릿의 테마·탭 유틸리티는 새 화면에서 사용하지 않습니다.

## 직접 확인할 시나리오

| 조작 | 기대 결과 |
| --- | --- |
| `우유 1L` 검색 | 서울우유 1L 상품만 표시 |
| `신라면` 검색 | 1개입과 5개입이 별도 상품으로 표시 |
| 검색어 없이 첫 진입 | 상품 목록 없이 자유 검색 안내 |
| `라면` 검색 | 4개 제조사·9개 규격의 제품 사진 목록 |
| 제조사 필터 선택 후 상품 클릭 | 선택 상품의 5개 마트 가격 요약 및 지점 비교 |
| 존재하지 않는 검색어 입력 후 초기화 | 빈 상태 표시 후 검색 안내 복원 |
| 우유 1L 비교 | 롯데마트 서구 예시점 2,780원이 일반 매장가 최저 |
| 이마트 필터 | 둔산 2,980원, 유성 3,080원 비교 |
| 홈플러스 익스프레스 필터 | 일반가 미확인, 최저가 없음 |
| 1+1 상세 | 총 3,300원 결제 · 2개 수령 · 개당 환산 1,650원 |
| 종료된 회원 행사 상세 | 행사 종료 및 일반가 비교 제외 표시 |
| 온라인 가격 상세 | 온라인 전용·배송비 별도 표시 |
| 상세 → 비교 → 검색 | 기존 필터와 검색 조건 유지 |
| 없는 상품·가격 ID로 직접 진입 | 검색으로 돌아갈 수 있는 안내 화면 |

## 상품 사진과 실제 데이터 연결

검색 첫 화면에는 상품을 미리 나열하지 않습니다. 검색어를 입력하고 검색 버튼 또는 Enter를 누르면 카탈로그 전체에서 찾고, 결과의 제조사 필터는 검색 결과에 맞춰 만들어집니다.
초기 SQL은 상품 14개와 라면 9개 규격을 넣습니다. 앱의 목록은 고정 배열이 아니라 Supabase의 `is_demo = true` 상품을 읽습니다. DB에 새 예시 상품을 추가하면 다시 검색했을 때 나타납니다. 실제 마트 전체 상품·현재 판매가격은 해당 마트 데이터 수집 연동 이후 제공할 수 있습니다.

라면 사진은 제조사 공식 페이지의 HTTPS 이미지를 표시합니다. 인터넷 연결이나 원본 주소 변경으로 사진이 로드되지 않으면 안내 문구를 보여줍니다.
대표 낱개 사진을 묶음 상품에 사용하는 경우 비교 규격을 따로 명시합니다. 앱은 DB의 `image_url`, `image_source_url`, `image_note`를 사용합니다. `product-catalog.ts`는 초기 SQL과 테스트의 기준 자료입니다.
사진은 상품 식별용이며 가격은 별도 예시 데이터입니다.

- shin: [공식 제품 페이지](https://brand.nongshim.com/shinramyun/main/index?searchProdCode=26)
- shin5: [공식 제품 페이지](https://www.nongshimshop.com/product/detail.html?product_no=2660&cate_no=61&display_group=1)
- jinHot: [공식 제품 페이지](https://www.otoki.com/product/otoki-brand-04)
- jinMild: [공식 제품 페이지](https://www.otoki.com/product/otoki-brand-04)
- samyang: [공식 제품 페이지](https://www.samyangfoods.com/kor/brand/view.do?seq=530)
- buldak: [공식 제품 페이지](https://www.samyangfoods.com/kor/brand/view.do?seq=53)
- carbo: [공식 제품 페이지](https://www.samyangfoods.com/kor/brand/view.do?seq=387)
- bibim: [공식 제품 페이지](https://paldofood.co.kr/product/noodle/12)
- teumsae: [공식 제품 페이지](https://paldofood.co.kr/product/noodle/179)

### 검토한 SSG API

2026-10-29에 공개 문서를 확인했습니다. 인증 API 자체를 호출하거나 인증키를 저장한 것은 아닙니다.

- [사용자가 제공한 상품 Q&A API](https://eapi.ssgadm.com/info/itemQnaApi.ssg)는 계약 협력업체의 미답변 문의 조회용입니다. 상품명 검색과 판매가격 수집용으로 사용할 수 없습니다.
- [API 이용 안내](https://eapi.ssgadm.com/info/apiGuide.ssg)는 Partner 계약·입점 이후 인증키 발급 절차를 설명합니다.
- [상품 목록 조회](https://eapi.ssgadm.com/info/item/getItemList.ssg)는 업체가 등록한 상품을 상품명 등으로 조회합니다.
- [온라인 상품 매가](https://eapi.ssgadm.com/info/online/item/itemPrice.ssg)는 인증된 상품의 판매가 관리 API입니다.
- 이 문서만으로 이마트 전체 카탈로그 또는 대전 오프라인 지점의 소비자 판매가격을 제공받을 수 있다고 판단할 수 없습니다. 대상 상품 범위, 온라인/지점별 가격 구분 및 사용 권한을 확인해야 합니다.
- 향후 인증키가 필요한 연동은 서버에서 처리하고 앱의 공개 환경변수나 Git 저장소에 인증키를 넣지 않습니다.

## Supabase를 사용하는 순서

테이블 생성·예시 데이터 입력·결과 확인 SQL을 `supabase/` 폴더에 준비했고 앱의 DB 조회도 구현했습니다. SQL을 실행해 11개 검사를 통과했다면 3번 공개 연결 정보 설정부터 진행합니다.

### 이 앱에서 맡길 역할

Supabase는 상품·마트·지점·가격 기록을 저장하고 앱이 조회할 수 있게 하는 백엔드입니다. Supabase를 연결하는 것만으로 마트 상품과 현재 가격이 자동으로 채워지지는 않습니다.
마트 API가 준비되기 전에는 현재 예시 데이터를 DB에 넣어 검색과 가격 비교를 검증할 수 있습니다.

예정 흐름:

```text
관리자가 등록한 예시 데이터 ──────────────┐
                                        ↓
마트 API(추후) → 수집 서버/Edge Function → Supabase DB → 앱의 검색·가격 비교
```

| 기능 | 이 앱에서 사용할 용도 |
| --- | --- |
| Database | 상품 카탈로그와 지점별 가격 기록 저장·조회 |
| Storage | 필요할 때 사용 권한이 있는 상품 사진 파일 저장. 지금은 공식 이미지 URL을 사용하므로 필수 아님 |
| Auth | 나중에 즐겨찾기·장바구니 등을 사용자별로 저장할 때 로그인에 사용 |
| Edge Functions | 추후 마트 API 호출·가공·저장처럼 앱 밖에서 처리할 작업에 사용 |

### 1. 개발용 프로젝트 만들기

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인하고 조직을 선택합니다.
2. New project에서 개발용 이름을 `mart-price-dev`처럼 정하고, 제공되는 지역 중 한국 사용자와 가까운 지역을 선택합니다.
3. DB 비밀번호는 본인이 보관합니다. 프로젝트가 준비되면 Table Editor와 SQL Editor에서 데이터를 관리할 수 있습니다.
4. 프로젝트의 Connect 또는 API 설정에서 Project URL과 **Publishable key**를 확인합니다.

호스팅 프로젝트로 시작할 때 PC에 PostgreSQL이나 Docker를 설치할 필요는 없습니다. 별도의 로컬 Supabase 환경은 나중에 필요할 때 구성합니다.
공식 안내: [Expo React Native 시작하기](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)

### 2. SQL Editor에서 테이블과 예시 데이터 만들기

프로젝트를 이미 만들었다면 여기서 시작합니다. 별도의 프로그램 설치나 터미널 명령은 필요하지 않습니다.

1. [Supabase 대시보드](https://supabase.com/dashboard)에서 만든 프로젝트를 엽니다.
2. 왼쪽 **SQL Editor**를 클릭하고 **New query** 또는 **+**로 빈 쿼리를 만듭니다. 실행 역할은 기본 관리자 `postgres`를 사용합니다.
3. VS Code에서 [테이블 생성 SQL](supabase/migrations/20261029000100_create_price_catalog.sql)을 열고 **파일 전체를 복사**해 붙여넣은 뒤 **Run**을 누릅니다. 이 단계는 최초 한 번만 실행합니다.
4. 성공하면 새 쿼리를 열어 [예시 데이터 SQL](supabase/seed.sql) 전체를 붙여넣고 **Run**을 누릅니다.
5. 새 쿼리에서 [결과 확인 SQL](supabase/verify.sql) 전체를 실행합니다. 최초 입력 직후에는 11개 검사 행의 `passed`가 모두 `true`여야 합니다.
6. 왼쪽 **Table Editor**에서 `public` 스키마를 선택하고 아래 네 테이블과 데이터를 확인합니다. 새 테이블이 보이지 않으면 새로고침합니다.

| 테이블 | 저장할 내용 | 최초 입력 건수 |
| --- | --- | ---: |
| `brands` | 이마트·홈플러스·롯데마트·이마트에브리데이·홈플러스 익스프레스 | 5 |
| `branches` | 마트 ID, 지점명, 대전광역시·구·동, 예시 여부 | 6 |
| `products` | 상품명, 제조사, 품목, 용량, 묶음 수, 사진 URL·출처, 검색어 | 14 |
| `price_observations` | 상품·마트·지점, 가격, 할인 조건, 수량, 확인 시각·행사 기간, 출처 | 89 |

**실행 시 알아둘 점**

- 각 파일을 부분 선택하지 말고 전체 실행합니다. 중간 오류가 발생하면 해당 파일의 입력은 모두 취소됩니다. 같은 연결에서 `current transaction is aborted`가 보이면 `rollback;`을 먼저 실행하고 오류 원인을 확인합니다.
- 테이블 생성 SQL은 최초 실행용입니다. `already exists`가 나오면 테이블을 삭제하지 말고 기존 생성 여부를 확인합니다. 이미 성공했다면 예시 데이터 단계로 진행합니다.
- 예시 데이터 SQL은 여러 번 실행해도 동일 ID를 중복 입력하거나 기존 행을 덮어쓰지 않습니다. 기존 실제 데이터와 예시 ID가 겹치면 입력을 중단합니다. 수동으로 수정한 예시를 초기화하는 용도로 쓰지 않습니다.
- 예시 지점·상품·가격은 `is_demo = true`로 표시합니다. 지점·가격·행사는 가상이며, 가격 89건 중 12건은 미확인(`NULL`)입니다. 마트 브랜드는 실제 브랜드 이름을 사용하는 공통 기준 정보입니다.
- 사진이 있는 상품은 9개입니다. 사진 URL·원문 출처는 상품 테이블에, 가격 출처는 가격 테이블에 별도 보관합니다. 확인되지 않은 바코드는 `NULL`로 둡니다.
- 예시 검증 기준 시각은 **2026-10-29 12:00 한국 시간**입니다. 행사 날짜를 현재 날짜로 자동 갱신하지 않습니다.
- 모든 테이블에 RLS와 읽기 권한을 설정합니다. 로그인 전후 앱 사용자는 공개 데이터를 조회만 할 수 있고, 입력·수정·삭제는 SQL Editor의 관리자나 수집 서버가 담당합니다. 검사 SQL은 실제로 `anon` 역할로 전환하여 읽기를 확인한 뒤 원래 역할로 복구합니다.
- 이 테이블의 행은 앱 사용자에게 공개되는 구조입니다. API 키·인증 헤더·개인 정보는 넣지 않습니다.

**가격 저장 규칙**

- 용량·묶음 수가 다르면 별도 상품 ID로 저장합니다. 한 묶음의 낱개 수(`pack_count`)와 행사 수령 묶음 수(`receive_quantity`)를 구분합니다.
- 미확인 금액은 `pay_amount = NULL`로 저장합니다. 일반/회원/카드/묶음 및 온라인/매장 가격을 각각 구분합니다.
- 온라인 가격은 `channel = 'online'`으로 저장하고, 실제 지점이 확인되지 않으면 `branch_id = NULL`을 사용합니다. 매장 가격에는 지점이 반드시 필요합니다.
- 실제 가격을 넣을 때는 새 상품·실제 지점을 등록하고 `is_demo = false`를 사용합니다. 실제/예시 가격을 같은 비교에 섞지 않습니다.
- 관측이 추가되면 기존 가격을 UPDATE하지 않고 새 ID와 `observed_at`으로 INSERT합니다. 상품·지점별 최신 관측을 선택한 **다음** 기간·금액·수량을 검사합니다. 최신 값이 미확인/종료 상태여도 과거 가격으로 되돌아가지 않습니다.
- 1+1에서 실제 결제액과 수령 수량을 각각 저장하고, 가격 관측만으로 재고를 판단하지 않습니다.

파일은 SQL Editor에서 수동 실행하도록 작성했습니다. Supabase CLI 초기화나 원격 migration 기록 등록은 아직 하지 않았으므로, 나중에 CLI를 도입할 때 이미 실행한 스키마의 이력을 맞춘 후 사용합니다.

공식 안내: [테이블과 SQL Editor](https://supabase.com/docs/guides/database/tables), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 3. 앱의 Supabase 연결 정보 설정하기

1. Supabase 프로젝트의 **Connect** 또는 **Settings → API Keys**에서 Project URL과 **Publishable key**(`sb_publishable_...`)를 확인합니다.
2. 프로젝트 루트의 [.env.example](.env.example)을 `.env.local`로 복사하고 자리표시자를 해당 프로젝트 값으로 바꿉니다. 이미 `.env.local`이 있으면 덮어쓰지 말고 두 값만 편집합니다.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

3. 실행 중인 Expo 터미널에서 `Ctrl + C`로 서버를 종료한 뒤 아래 명령을 실행합니다. 새 의존성·환경변수를 반영하도록 브라우저도 새로고침합니다.

```powershell
cd C:\juj\AI_automatize\Price_comparison\workspace\mart-price
npx.cmd expo start --clear --port 8082
```

4. 앱에서 `라면`을 검색하고 상품 → 지점별 비교 → 가격 상세 순서로 확인합니다. 초기 seed 그대로라면 라면 9개와 마트 5개 요약이 표시됩니다.

- 설치된 연결 패키지는 `@supabase/supabase-js`, `react-native-url-polyfill`입니다. 현재는 공개 데이터 조회만 사용하므로 로그인 세션 저장과 SQLite는 추가하지 않았습니다.
- `.env.local`은 Git에서 제외되어 있습니다. Publishable key는 앱에 포함되는 공개 키이며 RLS와 DB 권한으로 조회 범위를 제한합니다. Secret/service_role 키와 DB 비밀번호는 앱 설정에 사용하지 않습니다.
- 설정이 없으면 “데이터 연결 설정이 필요해요.”가 표시됩니다. 실패 시 로컬 예시 데이터로 대체하지 않습니다. 연결 오류는 결과 없음과 구분해 다시 시도 버튼을 제공합니다.
- 화면 복귀, 같은 검색어로 재검색, 비교·상세 화면의 “가격 다시 불러오기”, 목록을 아래로 당기기에서 재조회합니다. 이전 요청은 취소하며 20초 이상 응답이 없으면 재시도 안내를 표시합니다.
- 현재 범위는 `is_demo = true`, 지점 지역은 `대전광역시`입니다. 비교 기준은 초기 seed와 같은 **2026-10-29 12:00 한국 시간**입니다. 실제 가격 모드 전환과 현재 시각 정책은 별도 구현 대상입니다.
- 온라인 가격은 지점이 `NULL`이어도 온라인 항목에 표시합니다. 일반 매장 최저가에는 포함하지 않습니다.
- 현재 검색은 소규모 예시 카탈로그를 DB에서 페이지별로 읽고 기존 한글·규격 검색 규칙을 적용합니다. 서버의 행 반환 제한으로 1,000번째 이후 상품이 누락되지 않게 처리했습니다. 전국 규모의 실제 카탈로그를 도입할 때는 서버 검색·검색 결과 페이지 처리가 필요합니다.
- 앱 조회는 SELECT만 사용합니다. 상품·가격 추가 및 수정은 관리자가 Table Editor 또는 SQL Editor에서 수행합니다.

**DB 변경 반영 확인:** Table Editor에서 새 테스트 상품을 `is_demo = true`로 등록하고 고유한 상품명으로 검색합니다. 이미 검색한 상품을 수정했다면 같은 검색어로 다시 검색합니다. 상품 ID에 연결된 예시 가격이 없어도 상품은 검색되며 비교 화면에는 가격 미확인이 표시됩니다. 실제 상품은 현재 예시 화면에서 제외됩니다.

공식 안내: [Supabase와 Expo](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native), [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/), [API 키 구분](https://supabase.com/docs/guides/api/api-keys)

### 4. 마트 API는 준비된 후 연결하기

실제 조회 가능한 상품·가격 범위와 인증 방식이 정해지면 수집 서버나 Edge Function에서 데이터를 가져와 DB에 저장합니다.
앱은 저장된 최신 확인 가격을 조회하고 확인 시각·할인 조건을 함께 표시합니다.
마트 API가 준비되기 전까지는 예시 데이터로 이 구조를 먼저 검증하는 순서가 적합합니다.

## 초기 화면 구현 변경을 순서대로 커밋하기

아래 명령은 **Git Bash** 기준입니다. 변경 내용을 직접 확인한 뒤 순서대로 실행하면 됩니다.
데이터 → 계산 규칙 → 연결된 세 화면 → 문서 순서로 나눕니다. 서로 연결된 화면은 한 커밋으로 묶어 중간에 이동이 끊기지 않게 합니다.

```bash
cd /c/juj/AI_automatize/Price_comparison/workspace/mart-price
git status

git add -- src/features/prices/types.ts src/features/prices/demo-data.ts src/features/prices/product-catalog.ts
git commit -m "feat: 대전 가상 지점과 상품 가격 예시 데이터 추가"

git add -- src/features/prices/comparison.ts src/features/prices/brand-summary.ts scripts/brand-summary.test.cjs scripts/prices.test.cjs scripts/test-prices.cjs package.json
git commit -m "feat: 상품 검색과 지점별 가격 비교 규칙 구현"

git add -- src/app src/components/prices
git commit -m "feat: 사진 기반 상품 검색과 5개 마트 가격 비교 화면 구현"

git add -- README.md
git commit -m "docs: 데모 사용법과 Supabase 도입 순서 문서화"

git status
git push origin main
```

기존에 다른 변경을 스테이징했다면 각 커밋 전에 `git diff --cached --stat`으로 포함 파일을 확인하세요.
`package.json`은 검사 명령을 포함하므로 두 번째 커밋에 포함합니다. 이번에는 의존성을 추가하지 않아 `package-lock.json` 변경이 없습니다.

## Supabase SQL 추가 커밋

이전 화면 구현 커밋을 완료했다면 이번 SQL과 실행 안내는 다음처럼 함께 커밋합니다. 커밋과 push는 직접 실행합니다.

```bash
cd /c/juj/AI_automatize/Price_comparison/workspace/mart-price
git add -- supabase README.md
git diff --cached --stat
git commit -m "feat: Supabase 상품·지점·가격 테이블과 예시 데이터 추가"
```

## Supabase 앱 연결 커밋

앞 단계 SQL을 아직 커밋하지 않았다면 먼저 `supabase/`만 커밋한 뒤 앱 연결 코드를 묶습니다. 실제 연결 값이 있는 `.env.local`은 스테이징하지 않습니다.

```bash
cd /c/juj/AI_automatize/Price_comparison/workspace/mart-price
# SQL이 아직 커밋되지 않은 경우에만 실행
git add -- supabase
git commit -m "feat: Supabase 상품·지점·가격 테이블과 예시 데이터 추가"

git add -- .env.example package.json package-lock.json src scripts README.md
git diff --cached --stat
git commit -m "feat: Supabase 상품 검색과 지점별 가격 조회 연결"
```
