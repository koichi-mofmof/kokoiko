"use client";

import type { ProfileSettingsData } from "@/lib/dal/users";
import { useEffect, useState } from "react";
import { FirstTimeProfileDialog } from "./first-time-profile-dialog";

interface ProfileSetupProviderProps {
  profileData: ProfileSettingsData;
  children: React.ReactNode;
}

export function ProfileSetupProvider({
  profileData,
  children,
}: ProfileSetupProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (profileData && !profileData.displayName) {
      setIsOpen(true);
    }
  }, [profileData]);

  if (!profileData || profileData.displayName) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <FirstTimeProfileDialog
        profileData={profileData}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
