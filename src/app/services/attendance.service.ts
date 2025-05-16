import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Lecture {
  id: string;
  subject: string;
  teacherName: string;
  department: string;
  className: string;
  batch: string;
  timeFrom: string;
  timeTo: string;
  subjectType: 'Theory' | 'Practical';
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  status: 'present' | 'absent';
}

export interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent';
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTeacherLectures(teacherId: string, day: string): Observable<ApiResponse<Lecture[]>> {
    const params = new HttpParams()
      .set('teacher_id', teacherId)
      .set('day', day);

    return this.http.get<ApiResponse<Lecture[]>>(`${this.apiUrl}/teacher-lectures/`, { params });
  }

  getLectureStudents(timetableId: string): Observable<ApiResponse<Student[]>> {
    const params = new HttpParams()
      .set('timetable_id', timetableId)
      .set('date', new Date().toISOString().split('T')[0]);

    return this.http.get<ApiResponse<Student[]>>(`${this.apiUrl}/lecture-students/`, { params });
  }

  submitAttendance(timetableId: string, attendance: AttendanceRecord[], date: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/submit-attendance/`, {
      timetable_id: timetableId,
      attendance: attendance,
      date: date
    });
  }
}