// Dynamic-import the bootstrap so all shared singletons (react, lit, bion) are
// resolved through the federation runtime before the app renders. This avoids
// the "shared module not available for eager consumption" error.
import('./bootstrap')
