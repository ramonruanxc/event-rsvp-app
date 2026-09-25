import { runSmoke, smokeBaseUrl } from './smoke';

const baseUrl = smokeBaseUrl(process.env);
void runSmoke(baseUrl, fetch).then(({ ok, lines }) => {
  console.log(`smoke: ${baseUrl}`);
  for (const line of lines) console.log(line);
  process.exit(ok ? 0 : 1);
});
