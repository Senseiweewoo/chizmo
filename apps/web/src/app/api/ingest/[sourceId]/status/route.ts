import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { IngestionService } from '@/lib/services/ingestion-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const { sourceId } = await params;
    const source = await IngestionService.getSource(sourceId, userId);

    if (!source) {
      return NextResponse.json({ success: false, error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      status: source.status,
      progress: source.progress,
      error: source.error,
      result: source.result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get source status' },
      { status: 500 }
    );
  }
}