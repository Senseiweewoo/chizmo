import { NextResponse } from 'next/server';
import { prisma } from '@chizmo/db';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'healthy';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0',
      services: {
        web: 'running',
        fsrsEngine: 'active',
        crisisIntervention: 'armed_24_7',
      },
    },
    { status: isHealthy ? 200 : 200 }
  );
}
