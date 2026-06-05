/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the OpenTelemetry Collector (e.g. https://app.gdgocbion.web.id/otel).
  // Empty/undefined disables browser telemetry. See telemetry.ts.
  readonly VITE_OTEL_URL?: string
  // Build identifier, reported as service.version on spans.
  readonly VITE_BUILD_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
