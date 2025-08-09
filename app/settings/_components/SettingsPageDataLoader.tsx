import {
  fetchAuthenticatedUserWithProfile,
  UserWithProfileData,
} from "@/lib/dal/users";

interface SettingsPageData {
  initialData: UserWithProfileData | null;
  error?: string;
  userUnauthenticated?: boolean;
}

export async function SettingsPageDataLoader(): Promise<SettingsPageData> {
  const { userWithProfile, error, userUnauthenticated } =
    await fetchAuthenticatedUserWithProfile();

  if (userUnauthenticated) {
    return { initialData: null, userUnauthenticated: true, error };
  }

  if (error || !userWithProfile) {
    return {
      initialData: userWithProfile,
      error: error || "settings.loadError",
    };
  }

  return {
    initialData: userWithProfile,
    error: undefined,
    userUnauthenticated: false,
  };
}
