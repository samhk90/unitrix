import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LeaveBalance {
  remaining: number;
  total: number;
  used: number;
}

interface LeaveBalances {
  casual: LeaveBalance;
  sick: LeaveBalance;
  privileged: LeaveBalance;
}

interface LeaveApplication {
  id: string;
  applicationDate: Date;
  leaveType: string;
  fromDate: Date;
  toDate: Date;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

interface NewLeaveApplication {
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

@Component({
  selector: 'app-leaves',
  templateUrl: './leaves.component.html',
  styleUrls: ['./leaves.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LeavesComponent implements OnInit {
  leaveBalance: LeaveBalances = {
    casual: { remaining: 8, total: 12, used: 4 },
    sick: { remaining: 5, total: 7, used: 2 },
    privileged: { remaining: 15, total: 15, used: 0 }
  };

  leaveApplications: LeaveApplication[] = [
    {
      id: '1',
      applicationDate: new Date('2025-05-01'),
      leaveType: 'Casual',
      fromDate: new Date('2025-05-15'),
      toDate: new Date('2025-05-16'),
      days: 2,
      status: 'pending',
      reason: 'Personal work'
    }
  ];

  filteredApplications: LeaveApplication[] = [];
  filterStatus: string = 'all';
  showLeaveModal: boolean = false;

  newLeave: NewLeaveApplication = {
    type: '',
    fromDate: '',
    toDate: '',
    reason: ''
  };

  constructor() { }

  ngOnInit(): void {
    this.filterApplications();
  }

  getTotalUsedLeaves(): number {
    return this.leaveBalance.casual.used + 
           this.leaveBalance.sick.used + 
           this.leaveBalance.privileged.used;
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full ';
    switch (status) {
      case 'pending':
        return baseClasses + 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return baseClasses + 'bg-green-100 text-green-800';
      case 'rejected':
        return baseClasses + 'bg-red-100 text-red-800';
      default:
        return baseClasses + 'bg-gray-100 text-gray-800';
    }
  }

  filterApplications(): void {
    if (this.filterStatus === 'all') {
      this.filteredApplications = [...this.leaveApplications];
    } else {
      this.filteredApplications = this.leaveApplications.filter(
        app => app.status === this.filterStatus
      );
    }
  }

  openNewLeaveModal(): void {
    this.showLeaveModal = true;
    this.resetNewLeaveForm();
  }

  closeNewLeaveModal(): void {
    this.showLeaveModal = false;
    this.resetNewLeaveForm();
  }

  resetNewLeaveForm(): void {
    this.newLeave = {
      type: '',
      fromDate: '',
      toDate: '',
      reason: ''
    };
  }

  submitLeaveApplication(): void {
    const fromDate = new Date(this.newLeave.fromDate);
    const toDate = new Date(this.newLeave.toDate);
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newApplication: LeaveApplication = {
      id: (this.leaveApplications.length + 1).toString(),
      applicationDate: new Date(),
      leaveType: this.newLeave.type,
      fromDate: fromDate,
      toDate: toDate,
      days: days,
      status: 'pending',
      reason: this.newLeave.reason
    };

    this.leaveApplications.unshift(newApplication);
    this.filterApplications();
    this.closeNewLeaveModal();
  }

  viewApplication(application: LeaveApplication): void {
    // TODO: Implement view application details
    console.log('Viewing application:', application);
  }

  cancelApplication(application: LeaveApplication): void {
    // TODO: Implement cancel application
    console.log('Cancelling application:', application);
    const index = this.leaveApplications.findIndex(app => app.id === application.id);
    if (index !== -1) {
      this.leaveApplications.splice(index, 1);
      this.filterApplications();
    }
  }
}
