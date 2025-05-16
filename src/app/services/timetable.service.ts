import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

interface Department {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  department: Department;
}

interface Slot {
  id: number;
  start_time: string;
  end_time: string;
}

interface Subject {
  id: number;
  name: string;
  type: string;
}

interface Teacher {
  id: string;
  name: string;
  department: Department;
}

interface TimetableEntry {
  timetable_id: number;
  day: string;
  class: Class;
  batch_name: string;
  slot: Slot;
  subject: Subject;
  teacher: Teacher;
}

interface TimetableResponse {
  message: string;
  data: TimetableEntry[];
}

@Injectable({
  providedIn: 'root'
})
export class TimetableService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  getSlots(): Observable<Slot[]> {
    const headers = this.getHeaders();
    return this.http.get<Slot[]>(`${this.apiUrl}/slots`, { headers })
      .pipe(catchError(this.handleError));
  }
  getTimetableByTeacher(teacherId: string): Observable<TimetableResponse> {
    console.log('Fetching timetable for teacher:', teacherId);
    const headers = this.getHeaders();
    
    return this.http.get<TimetableResponse>(`${this.apiUrl}/timetable`, {
      headers,
      params: { teacher_id: teacherId }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getTimetable(): Observable<TimetableResponse> {
    const headers = this.getHeaders();
    return this.http.get<TimetableResponse>(`${this.apiUrl}/timetable`, { headers })
      .pipe(catchError(this.handleError));
  }

  getTimetableByClass(classId: string): Observable<TimetableResponse> {
    const headers = this.getHeaders();
    return this.http.get<TimetableResponse>(`${this.apiUrl}/timetable`, {
      headers,
      params: { class_id: classId }
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred while fetching the timetable.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Please login again to access the timetable.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}