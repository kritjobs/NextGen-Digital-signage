import type { TranslationKey } from './translations/en';

/**
 * Telemetry event i18n — shared by server.ts (writes eventKey + params) and the
 * client (renders via t()). Rows written before this feature only have the raw
 * English `message` — the UI falls back to it when no eventKey is present.
 */

/** Heartbeat status → translation key (per-status phrasing, no interpolation needed). */
export const TELEMETRY_HB_KEYS: Record<string, TranslationKey> = {
  online: 'evt.hbOnline',
  offline: 'evt.hbOffline',
  syncing: 'evt.hbSyncing',
  emergency: 'evt.hbEmergency',
  error: 'evt.hbError',
};

/** Stable eventKey for a heartbeat log row (unknown statuses use the {status} template). */
export function heartbeatEventKey(status: string): TranslationKey {
  return TELEMETRY_HB_KEYS[status] ?? 'evt.hbOther';
}
