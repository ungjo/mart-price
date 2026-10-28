# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 프로젝트 진행 상태

이마트, 홈플러스, 롯데마트, 이마트에브리데이, 홈플러스 익스프레스의 지점별 가격 비교 앱을 개발합니다. 대전시에서 먼저 검증하고 전국으로 확장하는 것이 목표입니다.

현재는 Expo 기본 프로젝트와 개발 검사 도구를 설정한 단계입니다. 상품 검색, 지점별 가격 비교, 실제 가격 수집과 데이터베이스 연결은 아직 구현하지 않았습니다.

## 초기 설정과 핵심 수정 이유

- 웹 탭 버튼: Expo Router의 탭 속성은 유지하면서 ref 타입을 실제 Pressable 인스턴스에 맞춰 타입 충돌을 해결했습니다.
- 웹 테마: 서버 렌더와 첫 hydration의 테마를 일치시키고, 이후 기기 테마를 적용하도록 useSyncExternalStore를 사용합니다.
- ESLint: Expo용 기본 규칙을 적용하고 생성된 dist 빌드 결과물은 검사에서 제외합니다. 검사 도구는 개발용 의존성으로 관리합니다.
- 의존성 잠금 파일: package-lock.json은 설치 버전을 재현하기 위한 파일이며, 패키지 설정 변경 시 함께 관리합니다.

## 개발 검사 명령

package.json이 있는 mart-price 프로젝트 폴더에서 실행하세요. 상위 workspace 폴더에서 실행하면 package.json을 찾지 못합니다.

| PowerShell 명령 | 확인하는 내용 |
| --- | --- |
| `npm.cmd run typecheck` | 파일을 생성하지 않고 TypeScript 타입 오류를 검사합니다. |
| `npm.cmd run lint` | Expo ESLint 규칙으로 코드와 React Hooks 사용을 검사합니다. |

두 검사는 서로 다른 문제를 찾으므로 수정 후 모두 실행합니다. 핵심 코드의 주석 작성 기준은 AGENTS.md에 기록되어 있습니다.


## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- ESLint is already configured. Run `npm run lint`; see ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/) for configuration details.
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
