// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // Expo 앱에 맞는 TypeScript, React, Hooks 등의 기본 검사 규칙을 적용한다.
  expoConfig,
  {
    // 직접 수정하는 소스에 집중하도록 생성된 웹 빌드 결과물은 검사에서 제외한다.
    ignores: ['dist/*'],
  },
]);
