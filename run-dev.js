const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;

function startProcess(name, cwd, args) {
  const child = spawn('npm', args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });

  child.on('error', (error) => {
    console.error(`Failed to start ${name}:`, error);
    shutdown(1);
  });

  return child;
}

const children = [
  startProcess('backend', path.join(rootDir, 'smartbill-backend'), ['run', 'dev']),
  startProcess('frontend', path.join(rootDir, 'smartbill-frontend'), [
    'run',
    'dev',
    '--',
    '--host',
    '127.0.0.1',
  ]),
];

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 150);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

