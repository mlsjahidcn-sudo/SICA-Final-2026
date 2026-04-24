import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function fetchContent() {
  const config = new Config();
  const client = new FetchClient(config);
  
  const url = 'https://coze-coding-project.tos.coze.site/create_attachment/2026-04-04/1514468682781177_609668aa1ef919085eeaf79e32dbc57d_study-in-china-platform-updates-2026-04-04%20%281%29.md?sign=4897380570-974ce09e46-0-e488a15ea177959a1a69878ab1b1d8ee3a3564a2dd2f1edf98c5a4a63ff54008';
  
  console.log('Fetching content from URL...');
  const response = await client.fetch(url);
  
  console.log('\n=== FETCHED CONTENT ===\n');
  console.log('Title:', response.title);
  console.log('Status:', response.status_code === 0 ? 'Success' : 'Failed');
  console.log('Status Message:', response.status_message);
  console.log('\n--- Content ---\n');
  
  for (const item of response.content) {
    if (item.type === 'text') {
      console.log(item.text);
    }
  }
}

fetchContent().catch(console.error);
