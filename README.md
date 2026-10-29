# 마트프라이스 · 대전 데모

같은 제조사·상품·용량·묶음 수량의 가격을 브랜드와 지점별로 비교하는 Expo / React Native 앱입니다.
전국 서비스가 목표이며, 첫 구현은 **대전시 가상 데이터**로 동작합니다.

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
- 로그인, 실제 가격 수집, 데이터베이스, 위치 권한, 지도, 앱 스토어 배포는 아직 구현하지 않았습니다.

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
- `test`: 가격 비교·검색·행사·수량·시간대 규칙의 자동 테스트 17개
- 테스트 실행기는 설치된 TypeScript로 순수 계산 코드만 임시 폴더에 변환하고 Node 내장 테스트를 실행한 뒤 임시 결과를 정리합니다. 추가 패키지는 필요하지 않습니다.
- 라우트를 새로 추가한 뒤 경로 타입이 오래되었다는 오류가 나면 `npm.cmd start`로 Expo Router의 경로 타입을 재생성한 뒤 타입 검사를 다시 실행합니다. `.expo`는 생성 파일이므로 커밋하지 않습니다.
- 웹 번들 확인: `npx.cmd expo export --platform web`. 결과물 `dist`는 커밋하지 않습니다.
- Git Bash에서는 위 명령의 `npm.cmd`를 `npm`, `npx.cmd`를 `npx`로 써도 됩니다.

## 주요 코드 위치

| 위치 | 역할 |
| --- | --- |
| `src/features/prices/types.ts` | 상품 규격, 브랜드, 지점, 가격 관측 타입 |
| `src/features/prices/product-catalog.ts` | 상품 카탈로그 및 공식 사진 출처 |
| `src/features/prices/brand-summary.ts` | 5개 마트별 요약 가격 |
| `src/features/prices/demo-data.ts` | 대전 예시 데이터와 고정 비교 시각 |
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
현재 카탈로그는 화면 검증용 14개 상품이며 라면 규격 9개(농심·오뚜기·삼양식품·팔도)를 포함합니다. 최종 서비스의 검색 범위를 이 상품들로 제한한다는 뜻이 아닙니다. 실제 전체 상품 검색에는 상품 저장소 또는 조회 API 연동이 필요하며 아직 연결하지 않았습니다.

라면 사진은 제조사 공식 페이지의 HTTPS 이미지를 표시합니다. 인터넷 연결이나 원본 주소 변경으로 사진이 로드되지 않으면 안내 문구를 보여줍니다.
대표 낱개 사진을 묶음 상품에 사용하는 경우 비교 규격을 따로 명시합니다. 이미지 주소·출처·포장 설명은 `product-catalog.ts`에 함께 기록합니다.
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

아래 내용은 다음 개발 단계의 설계와 사용 안내입니다. 현재 Supabase 패키지 설치·프로젝트 생성·테이블 생성·앱 연결은 하지 않았습니다.

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

### 2. 테이블과 읽기 권한 구성하기

다음 네 테이블부터 설계하고, 실제 생성 SQL은 다음 연결 작업에서 마이그레이션 파일로 관리합니다.

| 예정 테이블 | 저장할 내용 |
| --- | --- |
| `brands` | 비교할 마트 5개 |
| `branches` | 마트 ID, 지점명, 시·구·동 |
| `products` | 상품명, 제조사, 품목, 용량, 묶음 수량, 바코드, 사진 URL·출처, 검색어 |
| `price_observations` | 상품·마트·지점 ID, 금액, 온라인/매장 구분, 일반/회원/카드/묶음 조건, 결제·수령 수량, 확인 시각, 행사 기간, 출처, 예시 여부 |

- 용량·묶음 수가 다른 상품은 별도 ID로 저장합니다.
- 실제 API가 온라인 가격만 제공하면 온라인으로 저장합니다. 연결되지 않은 오프라인 지점 가격을 만들어 넣지 않습니다.
- 예시와 실제 관측값은 `is_demo` 같은 표시로 구분하며, 실제 가격 순위에 섞이지 않게 합니다.
- 앱 이용자에게 공개할 카탈로그·가격은 읽기만 허용하고, 등록·수정·삭제는 관리자 또는 수집 서버에서 처리합니다.
- 테이블 권한과 RLS(행 단위 접근 규칙)를 함께 설정합니다. 앱 공개 키로 읽기는 되고 가격 수정은 거부되는지 확인합니다.

공식 안내: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 3. 기존 앱을 DB 조회로 바꾸기

현재 앱의 `searchProducts`와 가격 조회는 로컬 TypeScript 배열을 읽습니다. 환경변수만 등록해도 DB 조회로 바뀌는 것은 아닙니다.
실제 연결 작업에서는 다음 순서로 진행합니다.

1. 14개 예시 상품, 5개 브랜드, 6개 지점, 예시 가격을 DB에 넣습니다.
2. 기존 Expo 앱 안에 Supabase 클라이언트를 추가합니다. 프로젝트를 다시 만들지 않습니다.
3. 상품 검색과 상품 상세·가격 조회 함수를 DB를 읽는 비동기 함수로 바꾸고, 로딩·오류·결과 없음 처리를 연결합니다.
4. 기존 비교 규칙과 테스트를 유지하면서 동일 규격·조건·기간을 지키는지 확인합니다.
5. DB에 새 예시 상품을 추가한 뒤 앱 재빌드 없이 검색 결과에 나타나는지 확인합니다.

연결 개발 시 설치할 명령(이번 작업에서는 실행하지 않음):

```powershell
npx.cmd expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite
```

프로젝트 루트의 `.env.local`에 넣을 공개 연결 정보 예시:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

위 값은 자리표시자입니다. 이 프로젝트는 `.env*.local`을 Git에서 제외하도록 이미 설정되어 있습니다.
Publishable key는 앱에 포함되는 공개 키이며, 데이터 접근 범위는 테이블 권한과 RLS로 제한합니다.
Secret key(`sb_secret_...`), 구형 `service_role` 키, 마트 인증키는 앱·`EXPO_PUBLIC_*` 환경변수·Git에 넣지 않고 서버 측 비밀 설정에서만 사용합니다.
공식 안내: [API 키 구분](https://supabase.com/docs/guides/api/api-keys), [Edge Functions 비밀 설정](https://supabase.com/docs/guides/functions/secrets)

### 4. 마트 API는 준비된 후 연결하기

실제 조회 가능한 상품·가격 범위와 인증 방식이 정해지면 수집 서버나 Edge Function에서 데이터를 가져와 DB에 저장합니다.
앱은 저장된 최신 확인 가격을 조회하고 확인 시각·할인 조건을 함께 표시합니다.
마트 API가 준비되기 전까지는 예시 데이터로 이 구조를 먼저 검증하는 순서가 적합합니다.

## 이번 변경을 순서대로 커밋하기

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
