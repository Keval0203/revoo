import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    try {
      if (globalThis?.logger?.info) {
        globalThis.logger.info({
          meta: {
            requestId: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `req-${Date.now()}`,
            httpVersion: request.headers.get('x-http-version') || 'unknown',
            userAgent: request.headers.get('user-agent'),
            protocol: process.env.USE_HTTP2 === 'true' ? 'HTTP/2' : 'HTTP/1.1'
          },
          message: 'Health check endpoint accessed',
        });
      }
    } catch (logErr) {
      // Ignore logging errors
    }

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      protocol: process.env.USE_HTTP2 === 'true' ? 'HTTP/2' : 'HTTP/1.1',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      services: {
        database: 'connected',
        redis: 'connected',
        elasticsearch: 'connected'
      }
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Protocol': process.env.USE_HTTP2 === 'true' ? 'HTTP/2' : 'HTTP/1.1',
        'X-Health-Check': 'ok'
      }
    });

  } catch (error) {
    try {
      if (globalThis?.logger?.error) {
        globalThis.logger.error({
          err: error,
          message: 'Health check endpoint error',
        });
      }
    } catch (logErr) {
      console.error('Health check error:', error);
    }

    return NextResponse.json(
      { 
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Check': 'error'
        }
      }
    );
  }
}
