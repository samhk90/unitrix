import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private router: Router) {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.loadUser();
  }

  // Changed from private to public
  async loadUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      this.currentUserSubject.next(user);
      return user;
    } catch (error) {
      console.error('Error loading user:', error);
      this.currentUserSubject.next(null);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        this.currentUserSubject.next(data.user);

        // Get teacher details
        const { data: teacherData, error: teacherError } = await this.supabase
          .from('erp_1_teacher')
          .select('*')
          .eq('Email', email)
          .single();

        if (teacherError) throw teacherError;

        if (teacherData) {
          sessionStorage.setItem('Teacherid', teacherData.Teacherid);
          this.router.navigate(['/dashboard']);
        } else {
          throw new Error('Teacher profile not found');
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUserSubject.next(null);
      sessionStorage.removeItem('Teacherid');
      localStorage.removeItem('rememberedEmail');
      this.router.navigate(['/login']);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset instructions');
    }
  }

  async resetPassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}