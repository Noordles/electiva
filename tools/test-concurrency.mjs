import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ['--test', 'server/tests/concurrency.test.js', 'server/tests/process-concurrency.test.js'], { stdio: 'inherit', env: { ...process.env, ELECTIVA_CON_EVIDENCE: 'artifacts/m3/concurrency.json', ELECTIVA_PROCESS_EVIDENCE: '1' } });
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
