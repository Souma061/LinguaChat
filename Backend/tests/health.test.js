import assert from 'node:assert';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';

const { server } = await import('../index.js');

let listener;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    listener = server.listen(0, resolve);
  });
  const { port } = listener.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (listener) {
    await new Promise((resolve, reject) => {
      listener.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
});

test('GET /health returns ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.deepStrictEqual(body, { status: 'ok' });
});
