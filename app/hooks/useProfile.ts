import { useState, useEffect } from 'react';
import { profileOps } from '@/lib/db';

export function useProfile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    profileOps.getFirst()
      .then(setUserProfile)
      .catch((e) => console.error('Error loading profile:', e))
      .finally(() => setIsLoading(false));
  }, []);

  return { userProfile, isLoading };
}
