import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseService } from './base.service';

export interface DepartmentClass {
  id: string;
  name: string;
  department: {
    id: string;
    name: string;
  };
}

export interface TeacherSubject {
  assignment_id: string;
  subject: {
    id: string;
    name: string;
    semester: number;
    type: string;
    batch: string;
    class: {
      id: string;
      name: string;
      department: {
        id: string;
        name: string;
      }
    }
  }
}

// Daily attendance response interfaces
export interface DailyAttendanceStudent {
  rollNo: string;
  name: string;
  status: 'Present' | 'Absent';
}

export interface DailyAttendanceResponse {
  date: string;
  class: string;
  subject?: string;
  stats: {
    present: number;
    absent: number;
    total: number;
  };
  students: DailyAttendanceStudent[];
}

// Weekly attendance response interfaces
export interface WeeklyAttendanceStudent {
  rollNo: string;
  name: string;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

export interface WeeklyAttendanceResponse {
  week: {
    start: string;
    end: string;
  };
  class: string;
  subject?: string;
  weeklyStats: WeeklyAttendanceStudent[];
}

// Subject-wise attendance response interfaces
export interface SubjectAttendanceStudent {
  rollNo: string;
  name: string;
  totalLectures: number;
  attended: number;
  percentage: number;
}

export interface SubjectAttendanceResponse {
  class: string;
  subject: string;
  totalLectures: number;
  studentStats: SubjectAttendanceStudent[];
}

// Custom date range attendance response interfaces
export interface CustomAttendanceStudent {
  rollNo: string;
  name: string;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

export interface CustomAttendanceResponse {
  dateRange: {
    start: string;
    end: string;
    totalDays: number;
  };
  class: string;
  subject?: string;
  summary: {
    totalStudents: number;
    belowThreshold: number;
    averageAttendance: number;
  };
  studentStats: CustomAttendanceStudent[];
}

// Monthly attendance response interfaces
export interface MonthlyAttendanceStudent {
  rollNo: string;
  name: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

export interface MonthlyAttendanceResponse {
  month: {
    start: string;
    end: string;
    totalDays: number;
  };
  class: string;
  subject?: string;
  summary: {
    totalStudents: number;
    averageAttendance: number;
    belowThreshold: number;
  };
  monthlyStats: MonthlyAttendanceStudent[];
}

// Class report interfaces
export interface SubjectStatistics {
  subject_name: string;
  subject_type: string;
  attendance_percentage: number;
  average_marks: number;
  total_lectures: number;
}

export interface StudentStatistics {
  roll_number: number;
  name: string;
  attendance_percentage: number;
  average_marks: number;
}

export interface ClassReportResponse {
  class_info: {
    class_name: string;
    department: string;
    year: string;
    total_students: number;
  };
  overall_statistics: {
    overall_attendance: number;
    total_subjects: number;
    average_class_performance: number;
  };
  subject_statistics: SubjectStatistics[];
  student_statistics: StudentStatistics[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService extends BaseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    super();
  }

  getDepartmentClasses(teacherId: string): Observable<{ data: DepartmentClass[] }> {
    return this.http.get<{ data: DepartmentClass[] }>(`${this.apiUrl}/department-classes?teacher_id=${teacherId}`);
  }

  getTeacherSubjects(teacherId: string): Observable<TeacherSubject[]> {
    return this.http.get<TeacherSubject[]>(`${this.apiUrl}/teacher-subjects?teacher_id=${teacherId}`);
  }

  getDailyAttendance(params: { 
    classId: string; 
    date: string; 
    subjectId?: string; 
  }): Observable<DailyAttendanceResponse> {
    const httpParams = new HttpParams()
      .set('classId', params.classId)
      .set('date', params.date)
      .set('subject_id', params.subjectId || '');

    return this.http.get<DailyAttendanceResponse>(`${this.apiUrl}/attendance/daily/`, { params: httpParams });
  }

  getWeeklyAttendance(params: { 
    classId: string; 
    date: string; 
    subjectId?: string; 
  }): Observable<WeeklyAttendanceResponse> {
    const httpParams = new HttpParams()
      .set('classId', params.classId)
      .set('date', params.date)
      .set('subject_id', params.subjectId || '');

    return this.http.get<WeeklyAttendanceResponse>(`${this.apiUrl}/attendance/weekly/`, { params: httpParams });
  }

  getSubjectAttendance(params: { 
    classId: string; 
    subjectId: string; 
  }): Observable<SubjectAttendanceResponse> {
    const httpParams = new HttpParams()
      .set('classId', params.classId)
      .set('subject_id', params.subjectId);

    return this.http.get<SubjectAttendanceResponse>(`${this.apiUrl}/attendance/subject/`, { params: httpParams });
  }

  getCustomAttendance(params: { 
    classId: string; 
    startDate: string; 
    endDate: string; 
    subjectId?: string; 
  }): Observable<CustomAttendanceResponse> {
    const httpParams = new HttpParams()
      .set('classId', params.classId)
      .set('start_date', params.startDate)
      .set('end_date', params.endDate)
      .set('subject_id', params.subjectId || '');

    return this.http.get<CustomAttendanceResponse>(`${this.apiUrl}/attendance/custom/`, { params: httpParams });
  }

  getMonthlyAttendance(params: { 
    classId: string; 
    date: string; 
    subjectId?: string; 
  }): Observable<MonthlyAttendanceResponse> {
    const httpParams = new HttpParams()
      .set('classId', params.classId)
      .set('date', params.date)
      .set('subject_id', params.subjectId || '');

    return this.http.get<MonthlyAttendanceResponse>(`${this.apiUrl}/attendance/monthly/`, { params: httpParams });
  }

  getClassReport(classId: string): Observable<{ message: string; data: ClassReportResponse }> {
    return this.http.get<{ message: string; data: ClassReportResponse }>(`${this.apiUrl}/class-report/?class_id=${classId}`);
  }
}