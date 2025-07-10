'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthService } from '@/lib/supabase/auth-service-client';

export function useAuthGuard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isSessionLoading = sessionStatus === 'loading';
      
      if (isSessionLoading) {
        return;
      }

      try {
        // Check NextAuth session (wallet users)
        if (session?.user) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // Check Supabase auth (email users)
        const userResult = await AuthService.getCurrentUser();
        const isEmailAuthenticated = userResult.success && userResult.user;

        if (isEmailAuthenticated) {
          setIsAuthenticated(true);
        } else {
          // No valid authentication found
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [session, sessionStatus, router]);

  return { isAuthenticated, loading };
}
