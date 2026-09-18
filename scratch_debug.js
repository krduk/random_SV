const http = require('http');
const { spawn } = require('child_process');

async function main() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-test-profile'
  ]);

  // Wait 1.5s for Chrome to start
  await new Promise(r => setTimeout(r, 1500));

  // Get debug target
  const json = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/new', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const wsUrl = json.webSocketDebuggerUrl;
  console.log('Target WebSocket:', wsUrl);

  const WebSocket = require('https'); // Let's use simple ws
}
main().catch(console.error);
