import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../app/services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    await auth.loadUser();
    
    if (auth.isAuthenticated()) {
      return true;
    }

    return router.parseUrl('/login');
  } catch (error) {
    console.error('Auth guard error:', error);
    return router.parseUrl('/login');
  }
};

export const loginGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    await auth.loadUser();
    
    if (auth.isAuthenticated()) {
      return router.parseUrl('/dashboard');
    }

    return true;
  } catch (error) {
    console.error('Login guard error:', error);
    return true;
  }
};