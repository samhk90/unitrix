import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveBalance, LeaveApplication } from '../../services/leave.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaves.component.html',
  styleUrls: ['./leaves.component.css']
})
export class LeavesComponent implements OnInit {
  leaveBalance: LeaveBalance = {
    casual: { total: 0, remaining: 0, used: 0 },
    sick: { total: 0, remaining: 0, used: 0 },
    privileged: { total: 0, remaining: 0, used: 0 }
  };

  applications: LeaveApplication[] = [];
  filteredApplications: LeaveApplication[] = [];
  filterStatus: string = 'all';
  showLeaveModal: boolean = false;

  newLeave = {
    type: '',
    fromDate: '',
    toDate: '',
    reason: ''
  };

  constructor(
    private leaveService: LeaveService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadLeaveBalance();
    this.loadLeaveApplications();
  }

  private loadLeaveBalance(): void {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    if (!teacher?.teacher_id) {
      this.alertService.error('Teacher ID not found. Please login again.');
      return;
    }

    this.leaveService.getLeaveBalance(teacher.teacher_id).subscribe({
      next: (response) => {
        if (response.data) {
          this.leaveBalance = response.data;
        }
      },
      error: (error) => {
        this.alertService.error('Failed to load leave balance');
        console.error('Error loading leave balance:', error);
      }
    });
  }

  private loadLeaveApplications(): void {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    if (!teacher?.teacher_id) {
      return;
    }

    this.leaveService.getLeaveApplications(teacher.teacher_id, this.filterStatus).subscribe({
      next: (response) => {
        if (response.data) {
          this.applications = response.data;
          this.filterApplications();
        }
      },
      error: (error) => {
        this.alertService.error('Failed to load leave applications');
        console.error('Error loading applications:', error);
      }
    });
  }

  openNewLeaveModal(): void {
    this.showLeaveModal = true;
    this.newLeave = {
      type: '',
      fromDate: '',
      toDate: '',
      reason: ''
    };
  }

  closeNewLeaveModal(): void {
    this.showLeaveModal = false;
  }

  submitLeaveApplication(): void {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    if (!teacher?.teacher_id) {
      this.alertService.error('Teacher ID not found. Please login again.');
      return;
    }

    const request = {
      teacher_id: teacher.teacher_id,
      leave_type_id: this.getLeaveTypeId(this.newLeave.type),
      from_date: this.newLeave.fromDate,
      to_date: this.newLeave.toDate,
      reason: this.newLeave.reason,
      requested_to: teacher.hod_id // Assuming HOD ID is stored in teacher object
    };

    this.leaveService.submitLeaveRequest(request).subscribe({
      next: (response) => {
        this.alertService.success('Leave application submitted successfully');
        this.closeNewLeaveModal();
        this.loadLeaveApplications();
        this.loadLeaveBalance();
      },
      error: (error) => {
        this.alertService.error(error.error?.error || 'Failed to submit leave application');
        console.error('Error submitting leave:', error);
      }
    });
  }

  cancelApplication(application: LeaveApplication): void {
    if (confirm('Are you sure you want to cancel this leave application?')) {
      this.leaveService.cancelLeaveRequest(application.id).subscribe({
        next: () => {
          this.alertService.success('Leave application cancelled successfully');
          this.loadLeaveApplications();
          this.loadLeaveBalance();
        },
        error: (error) => {
          this.alertService.error('Failed to cancel leave application');
          console.error('Error cancelling application:', error);
        }
      });
    }
  }

  viewApplication(application: LeaveApplication): void {
    this.leaveService.getLeaveDetails(application.id).subscribe({
      next: (response) => {
        // Here you can implement a modal to show the details
        console.log('Leave details:', response.data);
      },
      error: (error) => {
        this.alertService.error('Failed to load leave details');
        console.error('Error loading leave details:', error);
      }
    });
  }

  filterApplications(): void {
    if (this.filterStatus === 'all') {
      this.filteredApplications = this.applications;
    } else {
      this.filteredApplications = this.applications.filter(
        app => app.status.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }
  }

  getTotalUsedLeaves(): number {
    return (
      this.leaveBalance.casual.used +
      this.leaveBalance.sick.used +
      this.leaveBalance.privileged.used
    );
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
      case 'rejected':
        return 'inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
      case 'pending':
        return 'inline-block px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800';
      case 'pending principal approval':
        return 'inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800';
      default:
        return 'inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
    }
  }

  private getLeaveTypeId(type: string): number {
    // Map frontend leave types to backend IDs
    // You should adjust these IDs based on your backend configuration
    const typeMap: { [key: string]: number } = {
      'casual': 1,
      'sick': 2,
      'privileged': 3
    };
    return typeMap[type] || 1;
  }
}
