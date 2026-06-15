import assert from 'node:assert/strict';
import test from 'node:test';

import { getSyntheticPhoneRegistrationInput } from '../lib/auth/phone-auth';

test('synthetic phone registration uses an immediately confirmed admin-created account', () => {
  const params = getSyntheticPhoneRegistrationInput({
    normalizedPhone: '+22222123456',
    fullName: 'Test User',
    password: 'StrongPass123!',
  });

  assert.equal(params.email, '22222123456@phone.indb.local');
  assert.equal(params.password, 'StrongPass123!');
  assert.equal(params.email_confirm, true);
  assert.deepEqual(params.user_metadata, {
    full_name: 'Test User',
    phone: '+22222123456',
  });
});
