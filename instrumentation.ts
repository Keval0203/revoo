import type { Logger } from 'pino';

declare global {
  var isInstrumented: boolean | undefined;
  var logger: Logger | undefined;
  var metrics: {
    registry: any;
  } | undefined;
}

export async function register() {
  if (globalThis.isInstrumented) {
    return;
  }
  globalThis.isInstrumented = true;

  if (typeof window === 'undefined') {
    const logger: any = {
      info: (...args: any[]) => { try { console.log('[INFO]', ...args); } catch {} },
      error: (...args: any[]) => { try { console.error('[ERROR]', ...args); } catch {} },
      warn: (...args: any[]) => { try { console.warn('[WARN]', ...args); } catch {} },
      debug: () => {},
      trace: () => {},
      fatal: (...args: any[]) => { try { console.error('[FATAL]', ...args); } catch {} },
      silent: () => {},
      level: 'error',
      levels: { values: {}, labels: {} } as any,
      child: () => logger,
    };
    globalThis.logger = logger as Logger;

    if (typeof window === 'undefined' && process.env.NEXT_RUNTIME === 'nodejs') {
      try {
        const { Registry, collectDefaultMetrics } = await import('prom-client');
        const prometheusRegistry = new Registry();
        try {
          collectDefaultMetrics({ register: prometheusRegistry });
        } catch (e) {
          // ignore collection errors
        }
        globalThis.metrics = { registry: prometheusRegistry };
      } catch (e) {
        globalThis.metrics = { registry: null };
      }
    }
  }
}
