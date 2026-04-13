import { NextResponse } from 'next/server';
import { getAiClusterStatus } from '@/lib/ai-service';

/**
 * Endpoint de monitoreo para el Cluster de IA
 * Proporciona el estado real de las 8 llaves API
 */
export async function GET() {
  try {
    const status = getAiClusterStatus();
    
    // Calcular métricas agregadas
    const onlineCount = status.filter(s => s.status === 'online').length;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: status.length,
        online: onlineCount,
        cooldown: status.length - onlineCount,
        health_percentage: (onlineCount / status.length) * 100
      },
      keys: status
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI cluster status' },
      { status: 500 }
    );
  }
}
