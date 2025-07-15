'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/supabase/auth-service-client';

export function useAuthGuard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check Supabase auth (email users)
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
  }, [router]);

  return { isAuthenticated, loading };
}
