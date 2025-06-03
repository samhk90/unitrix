import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { environment } from '../../environments/environment';

export interface LeaveBalance {
  casual: { total: number; remaining: number; used: number };
  sick: { total: number; remaining: number; used: number };
  privileged: { total: number; remaining: number; used: number };
}

export interface LeaveApplication {
  id: number;
  applicationDate: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: string;
  reason: string;
  requestedTo: string;
  isApprovedByHOD: boolean;
  isApprovedByPrincipal: boolean;
  hodApprovalDate: string | null;
  principalApprovalDate: string | null;
}

export interface NewLeaveRequest {
  teacher_id: string;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  reason: string;
  requested_to: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService extends BaseService {
  constructor(private http: HttpClient) {
    
    super();
  }
  private apiUrl = environment.apiUrl;
  getLeaveBalance(teacherId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/leave/balance/`, {
      params: { teacher_id: teacherId }
    });
  }

  getLeaveApplications(teacherId: string, status: string = 'all'): Observable<any> {
    return this.http.get(`${this.apiUrl}/leave/applications/`, {
      params: { 
        teacher_id: teacherId,
        status: status
      }
    });
  }

  submitLeaveRequest(request: NewLeaveRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/leave/submit/`, request);
  }

  cancelLeaveRequest(leaveId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/leave/${leaveId}/cancel/`, {});
  }

  getLeaveDetails(leaveId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/leave/${leaveId}/`);
  }

  approveLeaveRequest(leaveId: number, teacherId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/leave/${leaveId}/approve/`, {
      teacher_id: teacherId
    });
  }

  rejectLeaveRequest(leaveId: number, teacherId: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/leave/${leaveId}/reject/`, {
      teacher_id: teacherId,
      reason: reason
    });
  }
}
