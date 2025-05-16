import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

export interface AttendanceReport {
  report_type: 'daily' | 'weekly' | 'monthly' | 'subject-wise' | 'custom';
  class_name: string;
  subject?: string;
  date_range: {
    start: string;
    end: string;
  };
  statistics: {
    total_students: number;
    average_attendance: number;
  };
  attendance_data: Array<{
    student_id: string;
    roll_number: string;
    name: string;
    total_classes: number;
    present_classes: number;
    absent_classes: number;
    attendance_percentage: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService extends BaseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    super();
  }

  getDepartmentClasses(teacherId: string): Observable<DepartmentClass[]> {
    return this.http.get<DepartmentClass[]>(`${this.apiUrl}/department-classes/?teacher_id=${teacherId}`);
  }

  getTeacherSubjects(teacherId: string): Observable<TeacherSubject[]> {
    return this.http.get<TeacherSubject[]>(`${this.apiUrl}/teacher-subjects/?teacher_id=${teacherId}`);
  }

  getAttendanceReport(params: {
    classId: string;
    reportType: 'daily' | 'weekly' | 'monthly' | 'subject-wise' | 'custom';
    subjectId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<AttendanceReport> {
    let url = `${this.apiUrl}/attendance-report/?class_id=${params.classId}&report_type=${params.reportType}`;

    if (params.subjectId) {
      url += `&subject_id=${params.subjectId}`;
    }
    if (params.date) {
      url += `&date=${params.date}`;
    }
    if (params.startDate) {
      url += `&start_date=${params.startDate}`;
    }
    if (params.endDate) {
      url += `&end_date=${params.endDate}`;
    }

    return this.http.get<AttendanceReport>(url);
  }
}