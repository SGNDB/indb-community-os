import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorKey } from '../lib/auth/auth-error-map';

test('maps phone-provider-disabled auth errors to a specific message key', () => {
  assert.equal(
    getAuthErrorKey({ message: 'Phone logins are disabled', code: 'phone_provider_disabled' }),
    'auth_phone_provider_disabled',
  );
});
