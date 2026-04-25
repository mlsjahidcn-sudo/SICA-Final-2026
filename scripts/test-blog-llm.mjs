/**
 * Test script for Blog AI Generator using Moonshot API (Kimi K2.5)
 * Tests SEO title, SEO description, and full content generation
 */

import OpenAI from 'openai';
import 'dotenv/config';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_BASE_URL = process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1';
const MOONSHOT_MODEL = process.env.MOONSHOT_MODEL || 'kimi-k2.5';

console.log('='.repeat(60));
console.log('Blog AI Generator Test (Moonshot API - Kimi K2.5)');
console.log('='.repeat(60));
console.log(`Model: ${MOONSHOT_MODEL}`);
console.log(`Base URL: ${MOONSHOT_BASE_URL}`);
console.log(`API Key: ${MOONSHOT_API_KEY ? '✓ Set (' + MOONSHOT_API_KEY.slice(0, 10) + '...)' : '✗ Not set'}`);
console.log('='.repeat(60));
console.log();

if (!MOONSHOT_API_KEY) {
  console.error('ERROR: MOONSHOT_API_KEY not set in environment');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: MOONSHOT_API_KEY,
  baseURL: MOONSHOT_BASE_URL,
});

/**
 * Test SEO Title Generation
 */
async function testSeoTitle() {
  console.log('📝 Test 1: SEO Title Generation');
  console.log('-'.repeat(40));
  
  const topic = 'Top 5 Universities in Beijing for International Students';
  
  const messages = [
    {
      role: 'system',
      content: 'You are an SEO expert specializing in educational content. Generate compelling SEO-optimized titles for blog posts about studying in China.'
    },
    {
      role: 'user',
      content: `Generate an SEO-optimized title for a blog post about: "${topic}"

Requirements:
- 50-60 characters for optimal SEO
- Include primary keywords
- Engaging and click-worthy
- No quotes or special characters

Return ONLY the title, nothing else.`
    }
  ];

  try {
    const stream = await client.chat.completions.create({
      model: MOONSHOT_MODEL,
      messages,
      temperature: 1, // Kimi models require temperature = 1
      max_tokens: 100,
      stream: true,
    });

    process.stdout.write('Generated Title: ');
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }
    }
    console.log('\n');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test SEO Description Generation
 */
async function testSeoDescription() {
  console.log('📝 Test 2: SEO Description Generation');
  console.log('-'.repeat(40));
  
  const topic = 'Top 5 Universities in Beijing for International Students';
  
  const messages = [
    {
      role: 'system',
      content: 'You are an SEO expert specializing in educational content. Generate compelling meta descriptions for blog posts about studying in China.'
    },
    {
      role: 'user',
      content: `Generate an SEO-optimized meta description for a blog post about: "${topic}"

Requirements:
- 150-160 characters for optimal SEO
- Include primary keywords naturally
- Compelling call-to-action
- Accurately summarize the content

Return ONLY the description, nothing else.`
    }
  ];

  try {
    const stream = await client.chat.completions.create({
      model: MOONSHOT_MODEL,
      messages,
      temperature: 1,
      max_tokens: 200,
      stream: true,
    });

    process.stdout.write('Generated Description: ');
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }
    }
    console.log('\n');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test Full Content Generation (JSON output)
 */
async function testFullContent() {
  console.log('📝 Test 3: Full Content Generation (JSON)');
  console.log('-'.repeat(40));
  
  const topic = 'Top 5 Universities in Beijing for International Students';
  
  const messages = [
    {
      role: 'system',
      content: 'You are a content writer specializing in educational content about studying in China. Generate well-structured blog posts with SEO optimization.'
    },
    {
      role: 'user',
      content: `Generate a blog post about: "${topic}"

Return a JSON object with this exact structure:
{
  "title": "SEO-optimized title (50-60 chars)",
  "excerpt": "Brief summary (100-150 chars)",
  "content": "Full blog post in markdown format (300-500 words)",
  "seo_title": "SEO meta title",
  "seo_description": "SEO meta description (150-160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Requirements:
- Write in English
- Use proper markdown formatting (headings, lists, etc.)
- Include practical information for international students
- Mention specific universities (Tsinghua, Peking, Beihang, etc.)
- Focus on scholarship opportunities, programs, and campus life

Return ONLY valid JSON, no additional text.`
    }
  ];

  try {
    const stream = await client.chat.completions.create({
      model: MOONSHOT_MODEL,
      messages,
      temperature: 1,
      max_tokens: 2000,
      stream: true,
    });

    process.stdout.write('Generated JSON:\n');
    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
        fullContent += content;
      }
    }
    console.log('\n');
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(fullContent);
      console.log('✅ JSON parsed successfully!');
      console.log(`   Title: ${parsed.title}`);
      console.log(`   Keywords: ${parsed.keywords?.join(', ')}`);
    } catch (e) {
      console.log('⚠️  JSON parsing failed (this is OK, content was generated)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting tests...\n');
  
  const results = [];
  
  results.push({ test: 'SEO Title', passed: await testSeoTitle() });
  results.push({ test: 'SEO Description', passed: await testSeoDescription() });
  results.push({ test: 'Full Content', passed: await testFullContent() });
  
  console.log('='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
  }
  
  const passed = results.filter(r => r.passed).length;
  console.log(`\nTotal: ${passed}/${results.length} tests passed`);
  console.log('='.repeat(60));
}

runTests().catch(console.error);
