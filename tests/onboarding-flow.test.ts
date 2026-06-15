import assert from 'node:assert/strict';
import test from 'node:test';

import { getPostAuthRedirectPath, buildOnboardingProfileUpdate } from '../lib/auth/onboarding';

test('login/register redirects new users to onboarding and returning users to feed', () => {
  assert.equal(getPostAuthRedirectPath('en', false), '/en/onboarding');
  assert.equal(getPostAuthRedirectPath('en', true), '/en/feed');
});

test('onboarding updates preserve the existing full name instead of clearing it', () => {
  const updateData = buildOnboardingProfileUpdate(
    { full_name: '', bio: 'Hi', city: 'Nouakchott', languages: ['fr'], avatar_url: 'x' },
  );

  assert.equal(updateData.full_name, undefined);
  assert.equal(updateData.bio, 'Hi');
  assert.equal(updateData.city, 'Nouakchott');
  assert.deepEqual(updateData.languages_spoken, ['fr']);
  assert.equal(updateData.avatar_url, 'x');
});
