// Browser (RUM) telemetry for the shell.
//
// Why here and not in nginx: the services only serve static files, so there is
// nothing to trace server-side. The interesting signal lives in the browser —
// page-load timing, fetches, and above all whether the Module Federation
// remotes (catalog/cart) actually load. Those traces are exported via OTLP/HTTP
// to an OpenTelemetry Collector (see ../../otel-collector) which forwards them
// to Cloud Trace + Cloud Monitoring.
//
// Disabled (no-op) when VITE_OTEL_URL is unset, so local dev and any build
// without a collector keep working untouched.
import { trace, SpanStatusCode, type Tracer } from '@opentelemetry/api'
import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction'

// Collector base URL (e.g. https://app.gdgocbion.web.id/otel). Injected at build
// time; empty in local dev so telemetry stays off.
const endpoint = import.meta.env.VITE_OTEL_URL?.replace(/\/$/, '')

// Falls back to the global no-op tracer until initTelemetry() wires a provider.
let tracer: Tracer = trace.getTracer('shell')

export function initTelemetry() {
  if (!endpoint) return

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'fe-shell',
      [ATTR_SERVICE_VERSION]: import.meta.env.VITE_BUILD_ID ?? 'dev',
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
      ),
    ],
  })

  // ZoneContextManager keeps span context across async boundaries (the federation
  // remote imports are deeply async), so child spans nest under the right parent.
  provider.register({ contextManager: new ZoneContextManager() })

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation(),
      new UserInteractionInstrumentation(),
    ],
  })

  tracer = trace.getTracer('shell')
}

// Wraps a Module Federation remote import in a span so the dashboard shows, per
// remote, how often it loads, how long it takes, and when it fails — the single
// biggest blind spot in a micro-frontend. No-ops cleanly when telemetry is off.
export function traceRemoteLoad<T>(remote: string, load: () => Promise<T>): Promise<T> {
  const span = tracer.startSpan('mfe.remote.load', {
    attributes: { 'mfe.remote.name': remote },
  })
  return load().then(
    (mod) => {
      span.setAttribute('mfe.remote.outcome', 'ok')
      span.end()
      return mod
    },
    (err: unknown) => {
      span.setAttribute('mfe.remote.outcome', 'error')
      span.recordException(err as Error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      })
      span.end()
      throw err
    },
  )
}

// Records a remote render-time failure caught by the React error boundary.
export function recordRemoteError(remote: string, error: unknown) {
  const span = tracer.startSpan('mfe.remote.render_error', {
    attributes: { 'mfe.remote.name': remote },
  })
  span.recordException(error as Error)
  span.setStatus({ code: SpanStatusCode.ERROR })
  span.end()
}
