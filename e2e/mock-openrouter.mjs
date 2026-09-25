import http from 'node:http';

/** Port from the shell (set by playwright.config.ts), default 4020. */
const port = Number(process.env.MOCK_OPENROUTER_PORT ?? 4020);
/** Same event as e2e/mock-anthropic.mjs, so both providers fill the same values (REQ-95). */
const output = {
  isEvent: true,
  name: 'Team dinner',
  description: 'Dinner with the team.',
  date: '2030-10-04',
  time: '19:00',
  timezone: null,
  location: "Mario's",
};

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    if (req.method !== 'POST' || req.url !== '/api/v1/chat/completions') {
      res.writeHead(404);
      res.end();
      return;
    }
    if (req.headers.authorization !== 'Bearer test-key') {
      send(res, 401, { error: { code: 401, message: 'mock: invalid key' } });
      return;
    }
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      send(res, 400, { error: { code: 400, message: 'mock: body is not JSON' } });
      return;
    }
    const format = body.response_format;
    if (
      format?.type !== 'json_schema' ||
      format.json_schema?.strict !== true ||
      !format.json_schema?.schema
    ) {
      send(res, 400, {
        error: { code: 400, message: 'mock: strict json_schema response_format required' },
      });
      return;
    }
    if (raw.includes('[[mock-error]]')) {
      send(res, 500, { error: { code: 500, message: 'mock failure' } });
      return;
    }
    send(res, 200, {
      id: 'gen-mock',
      object: 'chat.completion',
      created: 0,
      model: body.model,
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: { role: 'assistant', content: JSON.stringify(output) },
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });
  });
});
server.on('error', (error) => {
  console.error(`mock openrouter: ${error.message}`);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`mock openrouter listening on ${port}`));
