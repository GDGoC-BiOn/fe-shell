// Init telemetry BEFORE the app loads so the fetch/document-load instrumentation
// is in place when the federation remotes start fetching. No-ops if VITE_OTEL_URL
// is unset (see telemetry.ts).
import { initTelemetry } from './telemetry'
initTelemetry()

// Dynamic-import the bootstrap so all shared singletons (react, lit, bion) are
// resolved through the federation runtime before the app renders. This avoids
// the "shared module not available for eager consumption" error.
import('./bootstrap')
