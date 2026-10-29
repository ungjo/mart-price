/* global __dirname */
/* 추가 의존성 없이 순수 TypeScript 가격 규칙만 임시 폴더에 컴파일해 Node 테스트를 실행한다. */
const { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync, realpathSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(projectRoot, 'src', 'features', 'prices');
const tempRoot = realpathSync(tmpdir());
const buildRoot = mkdtempSync(path.join(tempRoot, 'mart-price-tests-'));
try {
  for (const name of readdirSync(sourceRoot).filter((name) => name.endsWith('.ts'))) {
    const result = ts.transpileModule(readFileSync(path.join(sourceRoot, name), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, strict: true },
      fileName: name,
    });
    writeFileSync(path.join(buildRoot, name.replace(/\.ts$/, '.js')), result.outputText, 'utf8');
  }
  const result = spawnSync(process.execPath, ['--test', path.join(__dirname, 'prices.test.cjs'), path.join(__dirname, 'brand-summary.test.cjs')], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, PRICES_TEST_BUILD: buildRoot },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  // 직접 생성한 OS 임시 하위 폴더인지 확인한 뒤 이 테스트의 빌드 결과만 정리한다.
  const relative = path.relative(tempRoot, path.resolve(buildRoot));
  if (!relative.startsWith('..') && !path.isAbsolute(relative) && relative.startsWith('mart-price-tests-')) {
    rmSync(buildRoot, { recursive: true, force: true });
  }
}
