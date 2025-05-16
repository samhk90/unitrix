import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface TeacherDetails {
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  role_name: string;
}

interface LoginResponse {
  message: string;
  teacher: TeacherDetails;
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentTeacherSubject: BehaviorSubject<TeacherDetails | null>;
  public currentTeacher$: Observable<TeacherDetails | null>;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.currentTeacherSubject = new BehaviorSubject<TeacherDetails | null>(this.getStoredTeacher());
    this.currentTeacher$ = this.currentTeacherSubject.asObservable();
  }

  private getStoredTeacher(): TeacherDetails | null {
    const teacherStr = localStorage.getItem('teacher');
    return teacherStr ? JSON.parse(teacherStr) : null;
  }

  signIn(email: string, password: string): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<LoginResponse>(`${environment.apiUrl}/login`, 
      { email, password },
      { headers }
    ).pipe(
      tap((response: LoginResponse) => {
        if (response.teacher && response.access_token) {
          localStorage.setItem('teacher', JSON.stringify(response.teacher));
          sessionStorage.setItem('access_token', response.access_token);
          sessionStorage.setItem('refresh_token', response.refresh_token || '');
          
          this.currentTeacherSubject.next(response.teacher);
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  signOut(): void {
    localStorage.removeItem('teacher');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    this.currentTeacherSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const teacher = this.currentTeacherSubject.value;
    const token = sessionStorage.getItem('access_token');
    return !!(teacher && token);
  }

  getCurrentTeacher(): TeacherDetails | null {
    return this.currentTeacherSubject.value;
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }
}