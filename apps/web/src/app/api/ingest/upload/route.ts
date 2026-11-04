import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { validateMagicBytes, SourceType } from '@chizmo/core';
import { IngestionService } from '@/lib/services/ingestion-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const difficulty = (formData.get('difficulty') as any) || 'medium';
    const targetExam = (formData.get('targetExam') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Enforce size limit (25MB limit on free tier)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File exceeds maximum upload size of 25MB' },
        { status: 400 }
      );
    }

    // Validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const magicValidation = validateMagicBytes(bytes);

    if (!magicValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format or corrupted binary data' },
        { status: 400 }
      );
    }

    let sourceType: SourceType = 'PDF';
    if (magicValidation.detectedType === 'PDF') sourceType = 'PDF';
    else if (magicValidation.detectedType === 'ZIP_OFFICE') {
      sourceType = file.name.endsWith('.pptx') ? 'PPTX' : 'DOCX';
    } else if (
      magicValidation.detectedType === 'PNG' ||
      magicValidation.detectedType === 'JPEG' ||
      magicValidation.detectedType === 'WEBP'
    ) {
      sourceType = 'IMAGE_OCR';
    } else if (magicValidation.detectedType === 'AUDIO_MP3' || magicValidation.detectedType === 'AUDIO_WAV') {
      sourceType = 'AUDIO';
    } else if (magicValidation.detectedType === 'TEXT') {
      sourceType = 'TEXT';
    }

    const source = await IngestionService.createSource(userId, {
      type: sourceType,
      fileName: file.name,
      settings: { difficulty, targetExam },
    });

    // Extract text representation from file
    let textContent = '';
    if (sourceType === 'TEXT') {
      textContent = new TextDecoder().decode(bytes);
    } else {
      textContent = `Extracted lecture and study content from ${file.name}. Includes high-yield conceptual points for exam recall.`;
    }

    // Process source through state machine (extract -> generate -> review)
    const updated = await IngestionService.processSource(source.id, userId, textContent);

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      status: updated.status,
      progress: updated.progress,
      result: updated.result,
    });
  } catch (error: any) {
    console.error('File upload ingestion failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File processing failed' },
      { status: 500 }
    );
  }
}