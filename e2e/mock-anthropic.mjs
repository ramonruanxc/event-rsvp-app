import http from 'node:http';

/** Port from the shell (set by playwright.config.ts), default 4010. */
const port = Number(process.env.MOCK_AI_PORT ?? 4010);
const output = {
  isEvent: true,
  name: 'Team dinner',
  description: 'Dinner with the team.',
  date: '2030-10-04',
  time: '19:00',
  timezone: null,
  location: "Mario's",
};

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    if (req.method !== 'POST' || !req.url?.startsWith('/v1/messages')) {
      res.writeHead(404);
      res.end();
      return;
    }
    if (body.includes('[[mock-error]]')) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'mock failure' } }),
      );
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'msg_mock',
        type: 'message',
        role: 'assistant',
        model: 'claude-haiku-4-5',
        content: [{ type: 'text', text: JSON.stringify(output) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );
  });
});
server.on('error', (error) => {
  console.error(`mock anthropic: ${error.message}`);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`mock anthropic listening on ${port}`));
