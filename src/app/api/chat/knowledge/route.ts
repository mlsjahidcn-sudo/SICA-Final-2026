import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeClient, Config, KnowledgeDocument, DataSourceType, ChunkConfig, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AddDocumentRequest {
  type: 'text' | 'url';
  content?: string; // For text type
  url?: string; // For url type
  tableName?: string;
  chunkConfig?: ChunkConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddDocumentRequest = await request.json();
    const { type, content, url, tableName = 'sica_knowledge', chunkConfig } = body;

    // Validate input
    if (type === 'text' && !content) {
      return NextResponse.json(
        { error: 'Content is required for text type' },
        { status: 400 }
      );
    }

    if (type === 'url' && !url) {
      return NextResponse.json(
        { error: 'URL is required for url type' },
        { status: 400 }
      );
    }

    // Extract headers for forwarding
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize knowledge client
    const config = new Config();
    const client = new KnowledgeClient(config, customHeaders);

    // Prepare document
    const documents: KnowledgeDocument[] = [];
    
    if (type === 'text') {
      documents.push({
        source: DataSourceType.TEXT,
        raw_data: content,
      });
    } else if (type === 'url') {
      documents.push({
        source: DataSourceType.URL,
        url: url,
      });
    }

    // Default chunk config
    const defaultChunkConfig: ChunkConfig = {
      separator: '\n\n',
      max_tokens: 2000,
      remove_extra_spaces: true,
      remove_urls_emails: false,
    };

    // Add documents to knowledge base
    const response = await client.addDocuments(
      documents,
      tableName,
      chunkConfig || defaultChunkConfig
    );

    if (response.code === 0) {
      return NextResponse.json({
        success: true,
        doc_ids: response.doc_ids,
        message: `Successfully added ${response.doc_ids?.length || 0} document(s)`,
      });
    } else {
      return NextResponse.json(
        { error: response.msg || 'Failed to add documents' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Knowledge add error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Search knowledge base
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const topK = parseInt(searchParams.get('topK') || '5');
    const minScore = parseFloat(searchParams.get('minScore') || '0.5');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Extract headers for forwarding
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize knowledge client
    const config = new Config();
    const client = new KnowledgeClient(config, customHeaders);

    // Search knowledge base
    const response = await client.search(query, undefined, topK, minScore);

    if (response.code === 0) {
      return NextResponse.json({
        success: true,
        results: response.chunks.map(chunk => ({
          content: chunk.content,
          score: chunk.score,
          doc_id: chunk.doc_id,
        })),
      });
    } else {
      return NextResponse.json(
        { error: response.msg || 'Search failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
