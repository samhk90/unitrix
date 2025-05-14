import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

interface LeaveStats {
  total: number;
  used: number;
}

interface LeaveApplication {
  type: 'paid' | 'special' | 'optional';
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  reason: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  showModal = false;
  leaveStats = {
    paid: { total: 12, used: 4 },
    special: { total: 5, used: 1 },
    optional: { total: 3, used: 0 }
  };

  leaveApplication: LeaveApplication = {
    type: 'paid',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    reason: ''
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: [] // Will be populated with leave applications
  };

  constructor() {}

  ngOnInit(): void {
    // Initialize with sample leave applications
    this.loadLeaveApplications();
  }

  private loadLeaveApplications(): void {
    // Sample leave data - replace with actual API call
    const sampleLeaves = [
      {
        title: 'Paid Leave',
        start: '2025-05-15',
        end: '2025-05-17',
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB'
      },
      {
        title: 'Special Leave',
        start: '2025-05-20',
        end: '2025-05-21',
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED'
      }
    ];

    this.calendarOptions.events = sampleLeaves;
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    this.leaveApplication.startDate = selectInfo.startStr;
    this.leaveApplication.endDate = selectInfo.endStr;
    this.showModal = true;
  }

  handleEventClick(clickInfo: { event: EventApi }): void {
    // Handle clicking on existing leave applications
    // You can show details or allow editing/cancellation
  }

  getTotalLeaveBalance(): number {
    return (
      (this.leaveStats.paid.total - this.leaveStats.paid.used) +
      (this.leaveStats.special.total - this.leaveStats.special.used) +
      (this.leaveStats.optional.total - this.leaveStats.optional.used)
    );
  }

  getTotalLeavePercentage(): number {
    const totalLeaves = this.leaveStats.paid.total + this.leaveStats.special.total + this.leaveStats.optional.total;
    const usedLeaves = this.leaveStats.paid.used + this.leaveStats.special.used + this.leaveStats.optional.used;
    return ((totalLeaves - usedLeaves) / totalLeaves) * 100;
  }

  submitLeaveApplication(): void {
    // Create the event object
    const newEvent = {
      title: `${this.leaveApplication.type.charAt(0).toUpperCase() + this.leaveApplication.type.slice(1)} Leave`,
      start: this.leaveApplication.startDate,
      end: this.leaveApplication.endDate,
      backgroundColor: this.getLeaveTypeColor(this.leaveApplication.type),
      borderColor: this.getLeaveTypeBorderColor(this.leaveApplication.type),
      extendedProps: {
        isHalfDay: this.leaveApplication.isHalfDay,
        reason: this.leaveApplication.reason
      }
    };

    // Add the event to the calendar
    const calendarApi = (this.calendarOptions.events as any[]);
    calendarApi.push(newEvent);
    this.calendarOptions.events = [...calendarApi];

    // Update leave stats
    this.updateLeaveStats(this.leaveApplication.type, this.calculateLeaveDays());

    // Reset form and close modal
    this.resetForm();
    this.closeModal();
  }

  private calculateLeaveDays(): number {
    const start = new Date(this.leaveApplication.startDate);
    const end = new Date(this.leaveApplication.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return this.leaveApplication.isHalfDay ? 0.5 : days;
  }

  private updateLeaveStats(type: 'paid' | 'special' | 'optional', days: number): void {
    this.leaveStats[type].used += days;
  }

  private getLeaveTypeColor(type: string): string {
    switch (type) {
      case 'paid': return '#3B82F6';
      case 'special': return '#8B5CF6';
      case 'optional': return '#10B981';
      default: return '#3B82F6';
    }
  }

  private getLeaveTypeBorderColor(type: string): string {
    switch (type) {
      case 'paid': return '#2563EB';
      case 'special': return '#7C3AED';
      case 'optional': return '#059669';
      default: return '#2563EB';
    }
  }

  resetForm(): void {
    this.leaveApplication = {
      type: 'paid',
      startDate: '',
      endDate: '',
      isHalfDay: false,
      reason: ''
    };
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }
}
