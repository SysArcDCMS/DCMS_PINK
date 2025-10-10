import { useState, useEffect } from 'react';

export type Route = 'home' | 'login' | 'signup' | 'dashboard' | 'verify-otp' | 'change-password';

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  'verify-otp': '/verify-otp',
  'change-password': '/change-password'
} as const;

export function useRouter() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home');

  useEffect(() => {
    // Simple routing based on URL path
    const path = window.location.pathname;
    
    if (path.includes('/verify-otp')) {
      setCurrentRoute('verify-otp');
    } else if (path.includes('/change-password')) {
      setCurrentRoute('change-password');
    } else if (path.includes('/signup')) {
      setCurrentRoute('signup');
    } else if (path.includes('/login')) {
      setCurrentRoute('login');
    } else if (path.includes('/dashboard')) {
      setCurrentRoute('dashboard');
    } else {
      setCurrentRoute('home');
    }
  }, []);

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/verify-otp')) {
        setCurrentRoute('verify-otp');
      } else if (path.includes('/change-password')) {
        setCurrentRoute('change-password');
      } else if (path.includes('/signup')) {
        setCurrentRoute('signup');
      } else if (path.includes('/login')) {
        setCurrentRoute('login');
      } else if (path.includes('/dashboard')) {
        setCurrentRoute('dashboard');
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: Route) => {
    window.history.pushState({}, '', ROUTES[route]);
    setCurrentRoute(route);
  };

  return {
    currentRoute,
    navigate
  };
}