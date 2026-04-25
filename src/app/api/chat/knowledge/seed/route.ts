import { NextRequest, NextResponse } from 'next/server';
import { seedKnowledge } from '@/lib/chat/knowledge-seeder';
import { verifyAdmin } from '@/lib/auth-utils';

// POST /api/chat/knowledge/seed - Seed knowledge base from DB data (admin only)
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const result = await seedKnowledge();

    return NextResponse.json({
      message: `Knowledge base seeded successfully`,
      seeded: result.seeded,
    });
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
    return NextResponse.json({ error: 'Failed to seed knowledge base' }, { status: 500 });
  }
}
