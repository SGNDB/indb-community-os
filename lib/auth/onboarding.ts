export function getPostAuthRedirectPath(
  locale: string,
  onboardingCompleted: boolean | null | undefined,
): string {
  return `/${locale}/${onboardingCompleted ? 'feed' : 'onboarding'}`;
}

export function buildOnboardingProfileUpdate(
  profileData: {
    full_name?: string;
    bio?: string;
    city?: string;
    languages?: string[];
    avatar_url?: string;
  },
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  if (typeof profileData.full_name === 'string' && profileData.full_name.trim().length > 0) {
    updateData.full_name = profileData.full_name.trim();
  }

  if (typeof profileData.bio === 'string') {
    updateData.bio = profileData.bio.trim() || null;
  }

  if (typeof profileData.city === 'string') {
    updateData.city = profileData.city.trim() || null;
  }

  if (Array.isArray(profileData.languages)) {
    updateData.languages_spoken = profileData.languages;
  }

  if (profileData.avatar_url) {
    updateData.avatar_url = profileData.avatar_url;
  }

  return updateData;
}
