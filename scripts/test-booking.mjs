import ts from 'typescript';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Compile the React-independent domain with the existing compiler; no test dependency needed.
const output = mkdtempSync(join(tmpdir(), 'blissed-booking-tests-'));
try {
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  const files = parsed.fileNames.filter(name => /features\/booking\/(domain|data|providers)\//.test(name));
  const program = ts.createProgram(files, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, strict: true, skipLibCheck: true, outDir: output, rootDir: 'src', types: [], lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'] });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) { console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: name => name, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' })); process.exitCode = 1; }
  else {
    program.emit();
    const result = spawnSync(process.execPath, ['--test', 'tests/booking.test.cjs', 'tests/booking-preview.test.mjs'], { stdio: 'inherit', env: { ...process.env, BOOKING_TEST_BUILD: output } });
    process.exitCode = result.status ?? 1;
  }
} finally { rmSync(output, { recursive: true, force: true }); }
