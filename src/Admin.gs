/**
 * A2Z Web Backend admin security and token engine.
 *
 * Required Script Property:
 *   A2Z_ADMIN_EMAILS = comma-separated Google account email addresses.
 *
 * IMPORTANT: Admin functions must be reached through a web-app deployment that
 * executes as USER_ACCESSING. Every callable admin function checks the allowlist.
 */

function a2zAdminEmail_() {
  return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
}

function a2zAdminAllowlist_() {
  const raw = PropertiesService.getScriptProperties().getProperty('A2Z_ADMIN_EMAILS') || '';
  return raw.split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
}

function a2zRequireAdmin_() {
  const email = a2zAdminEmail_();
  const allowed = a2zAdminAllowlist_();
  if (!email || allowed.indexOf(email) === -1) {
    throw new Error('Access denied.');
  }
  return email;
}

function a2zAdminPage_() {
  const email = a2zAdminEmail_();
  if (!email || a2zAdminAllowlist_().indexOf(email) === -1) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Access denied</title><body style="font-family:system-ui;background:#0b0f0d;color:#e8eee9;padding:40px">' +
      '<h1>Access denied</h1><p>This Google account is not authorized for A2Z Web Backend administration.</p></body>'
    ).setTitle('A2Z Web Backend — Access denied');
  }
  return HtmlService.createHtmlOutputFromFile('Admin').setTitle('A2Z Web Backend');
}

function a2zTokenConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    prefix: props.getProperty('A2Z_TOKEN_PREFIX') || 'A2Z',
    start: Number(props.getProperty('A2Z_TOKEN_START') || 1),
    end: Number(props.getProperty('A2Z_TOKEN_END') || 9999),
    padding: Number(props.getProperty('A2Z_TOKEN_PADDING') || 4),
    reset: props.getProperty('A2Z_TOKEN_RESET') || 'never'
  };
}

function a2zTokenPeriod_(reset, date) {
  const tz = 'Asia/Colombo';
  if (reset === 'daily') return Utilities.formatDate(date, tz, 'yyyyMMdd');
  if (reset === 'monthly') return Utilities.formatDate(date, tz, 'yyyyMM');
  if (reset === 'yearly') return Utilities.formatDate(date, tz, 'yyyy');
  return 'never';
}

function a2zTokenStateKey_(config, date) {
  return 'A2Z_TOKEN_CURRENT_' + a2zTokenPeriod_(config.reset, date);
}

function a2zRequestTokenKey_(requestId) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(requestId), Utilities.Charset.UTF_8);
  return 'A2Z_TOKEN_REQ_' + bytes.map(v => ('0' + ((v + 256) % 256).toString(16)).slice(-2)).join('');
}

function a2zFormatToken_(config, number) {
  const n = String(number).padStart(config.padding, '0');
  return config.prefix ? config.prefix + '-' + n : n;
}

function a2zAllocateToken_(requestId) {
  if (!/^[a-f0-9-]{36}$/i.test(String(requestId || ''))) throw new Error('Invalid request ID.');
  const props = PropertiesService.getScriptProperties();
  const requestKey = a2zRequestTokenKey_(requestId);
  const existing = props.getProperty(requestKey);
  if (existing) return existing;

  // Caller currently holds the booking script lock. Keep this function safe if
  // reused elsewhere by taking a lock only when one is not already available.
  const config = a2zTokenConfig_();
  if (!Number.isInteger(config.start) || !Number.isInteger(config.end) ||
      config.start < 0 || config.end < config.start || config.end > 999999999) {
    throw new Error('Token configuration is invalid.');
  }

  const stateKey = a2zTokenStateKey_(config, new Date());
  const currentRaw = props.getProperty(stateKey);
  const next = currentRaw === null ? config.start : Number(currentRaw) + 1;
  if (!Number.isSafeInteger(next) || next > config.end) {
    throw new Error('Token range exhausted. Contact A2Z.');
  }

  const token = a2zFormatToken_(config, next);
  props.setProperty(stateKey, String(next));
  props.setProperty(requestKey, token);
  return token;
}

function adminGetDashboard() {
  const email = a2zRequireAdmin_();
  const config = a2zTokenConfig_();
  const props = PropertiesService.getScriptProperties();
  const stateKey = a2zTokenStateKey_(config, new Date());
  const currentRaw = props.getProperty(stateKey);
  const current = currentRaw === null ? null : Number(currentRaw);
  const next = current === null ? config.start : current + 1;
  return {
    ok: true,
    email: email,
    token: {
      config: config,
      current: current,
      nextPreview: next <= config.end ? a2zFormatToken_(config, next) : 'EXHAUSTED',
      remaining: Math.max(0, config.end - (current === null ? config.start - 1 : current))
    }
  };
}

function adminSaveTokenConfig(input) {
  const email = a2zRequireAdmin_();
  input = input || {};
  const prefix = String(input.prefix || '').trim().toUpperCase();
  const start = Number(input.start);
  const end = Number(input.end);
  const padding = Number(input.padding);
  const reset = String(input.reset || 'never');

  if (!/^[A-Z0-9_-]{0,16}$/.test(prefix)) throw new Error('Prefix may contain A-Z, 0-9, _ and - only.');
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > 999999999) {
    throw new Error('Enter a valid token range.');
  }
  if (!Number.isInteger(padding) || padding < 1 || padding > 12) throw new Error('Padding must be 1-12.');
  if (['never','daily','monthly','yearly'].indexOf(reset) === -1) throw new Error('Invalid reset policy.');

  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    A2Z_TOKEN_PREFIX: prefix,
    A2Z_TOKEN_START: String(start),
    A2Z_TOKEN_END: String(end),
    A2Z_TOKEN_PADDING: String(padding),
    A2Z_TOKEN_RESET: reset
  }, false);

  console.log(JSON.stringify({event:'admin_token_config_changed', actor:email, at:new Date().toISOString()}));
  return adminGetDashboard();
}
