import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { validateSafeUrl, extractYouTubeVideoId, SourceType } from '@chizmo/core';
import { IngestionService } from '@/lib/services/ingestion-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { url, difficulty = 'medium', targetExam } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid URL is required' }, { status: 400 });
    }

    // SSRF Guard
    const ssrfCheck = validateSafeUrl(url);
    if (!ssrfCheck.safe) {
      return NextResponse.json({ success: false, error: ssrfCheck.error }, { status: 400 });
    }

    const isYouTube = !!extractYouTubeVideoId(url);
    const sourceType: SourceType = isYouTube ? 'YOUTUBE' : 'WEB_URL';

    const source = await IngestionService.createSource(userId, {
      type: sourceType,
      url: ssrfCheck.normalizedUrl,
      settings: { difficulty, targetExam },
    });

    // Run extraction & generation pipeline
    const updated = await IngestionService.processSource(source.id, userId);

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      status: updated.status,
      progress: updated.progress,
      result: updated.result,
    });
  } catch (error: any) {
    console.error('URL ingestion failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'URL processing failed' },
      { status: 500 }
    );
  }
}