const DEMO_PREFIX = 'DEMO-REQ-001-20260918-01';

type ApprovedTarget = 'local' | 'preview' | 'production';

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
}

function validateApprovedTarget(value: string): asserts value is ApprovedTarget {
  if (value !== 'local' && value !== 'preview' && value !== 'production') {
    throw new Error('BUSINESS_DIRECT_E2E_TARGET must be one of local, preview, or production.');
  }
}

function validateBaseUrl(target: ApprovedTarget, rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('BUSINESS_DIRECT_E2E_BASE_URL must be a valid absolute URL.');
  }

  const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
  if (target === 'local' && !isLoopback) {
    throw new Error('A local E2E target must use a loopback BUSINESS_DIRECT_E2E_BASE_URL.');
  }
  if (target !== 'local' && (url.protocol !== 'https:' || isLoopback)) {
    throw new Error('A preview or production E2E target must use a non-loopback HTTPS BUSINESS_DIRECT_E2E_BASE_URL.');
  }
}

function requireSyntheticOwner(name: 'BUSINESS_DIRECT_E2E_OWNER_EMAIL' | 'BUSINESS_DIRECT_E2E_OWNER_PASSWORD'): void {
  if (!requiredEnvironment(name).startsWith(DEMO_PREFIX)) {
    throw new Error(`${name} must begin with the approved synthetic data prefix.`);
  }
}

export default function globalSetup(): void {
  const target = requiredEnvironment('BUSINESS_DIRECT_E2E_TARGET');
  validateApprovedTarget(target);

  if (requiredEnvironment('BUSINESS_DIRECT_E2E_TARGET_APPROVAL') !== DEMO_PREFIX) {
    throw new Error('BUSINESS_DIRECT_E2E_TARGET_APPROVAL does not match the approved requirement run.');
  }

  validateBaseUrl(target, requiredEnvironment('BUSINESS_DIRECT_E2E_BASE_URL'));
  requireSyntheticOwner('BUSINESS_DIRECT_E2E_OWNER_EMAIL');
  requireSyntheticOwner('BUSINESS_DIRECT_E2E_OWNER_PASSWORD');
}
