import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { IngestionService } from '@/lib/services/ingestion-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { content, title, delimiter } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Export content text is required' },
        { status: 400 }
      );
    }

    const result = await IngestionService.importQuizletAnkiDeck(
      userId,
      content,
      title,
      delimiter
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Quizlet/Anki import failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}