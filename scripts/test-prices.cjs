/* global __dirname */
/* 가격 규칙과 DB 조회 모듈을 원래 상대 경로대로 임시 컴파일해 Node 테스트를 실행한다. */
const { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync, realpathSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const tempRoot = realpathSync(tmpdir());
const buildRoot = mkdtempSync(path.join(tempRoot, 'mart-price-tests-'));
try {
  for (const relativeRoot of ['features/prices', 'lib']) {
    const sourceRoot = path.join(projectRoot, 'src', relativeRoot);
    const outputRoot = path.join(buildRoot, relativeRoot);
    mkdirSync(outputRoot, { recursive: true });
    for (const name of readdirSync(sourceRoot).filter(name => name.endsWith('.ts'))) {
      const result = ts.transpileModule(readFileSync(path.join(sourceRoot, name), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, strict: true },
        fileName: name,
      });
      writeFileSync(path.join(outputRoot, name.replace(/\.ts$/, '.js')), result.outputText, 'utf8');
    }
  }
  // 테이블·키 없이 fake client를 주입하므로 테스트는 외부 Supabase에 접근하지 않는다.
  const tests = readdirSync(__dirname).filter(name => name.endsWith('.test.cjs')).map(name => path.join(__dirname, name));
  const result = spawnSync(process.execPath, ['--test', ...tests], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, PRICES_TEST_BUILD: path.join(buildRoot, 'features', 'prices') },
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
