import assert from 'node:assert/strict';
import test from 'node:test';

import { getSyntheticPhoneLoginCredentials, getSyntheticPhoneRegistrationInput } from '../lib/auth/phone-auth';

test('phone registration uses a synthetic email account internally for the MVP flow', () => {
  const params = getSyntheticPhoneRegistrationInput({
    normalizedPhone: '+22222123456',
    fullName: 'Test User',
    password: 'StrongPass123!',
  });

  assert.equal(params.email, '22222123456@phone.indb.local');
  assert.equal(params.email_confirm, true);
  assert.equal(params.password, 'StrongPass123!');
  assert.equal(params.phone, '+22222123456');
  assert.deepEqual(params.user_metadata, {
    full_name: 'Test User',
    phone: '+22222123456',
  });
});

test('phone login uses the synthetic email credential instead of the phone provider path', () => {
  const credentials = getSyntheticPhoneLoginCredentials('+22222123456', 'StrongPass123!');

  assert.deepEqual(credentials, {
    email: '22222123456@phone.indb.local',
    password: 'StrongPass123!',
  });
});
