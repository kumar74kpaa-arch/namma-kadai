'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';

interface AnonymousAuthProviderProps {
  children: ReactNode;
}

export function AnonymousAuthProvider({ children }: AnonymousAuthProviderProps) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If the user state is done loading and there is no user, sign them in.
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  return <>{children}</>;
}
