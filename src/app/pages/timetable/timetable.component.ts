import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgLetDirective } from '../../shared/directives/ng-let.directive';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  className: string;
  batch?: string;
  room?: string;
}

interface DaySchedule {
  [key: string]: TimeSlot[];
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, NgLetDirective],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit {
  selectedClass: string = '';
  selectedBatch: string = '';
  
  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  timeSlots: string[] = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
  
  classes: string[] = ['SE_Computer', 'TE_Computer', 'BE_Computer'];
  batches: string[] = ['A', 'B', 'C'];

  // Sample timetable data
  weeklySchedule: { [key: string]: DaySchedule } = {
    'SE_Computer': {
      'Monday': [
        {
          id: '1',
          startTime: '9:00 AM',
          endTime: '10:00 AM',
          subject: 'Computer Graphics',
          teacher: 'N Zaman',
          className: 'SE_Computer',
          batch: 'A',
          room: 'Lab 1'
        },
        {
          id: '2',
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          subject: 'Database Management',
          teacher: 'M Khan',
          className: 'SE_Computer',
          batch: 'B',
          room: '301'
        }
      ],
      'Tuesday': [
        {
          id: '3',
          startTime: '9:00 AM',
          endTime: '10:00 AM',
          subject: 'Operating Systems',
          teacher: 'P Shah',
          className: 'SE_Computer',
          batch: 'C',
          room: 'Lab 2'
        }
      ],
      'Wednesday': [
        {
          id: '4',
          startTime: '11:00 AM',
          endTime: '12:00 PM',
          subject: 'Data Structures',
          teacher: 'R Kumar',
          className: 'SE_Computer',
          batch: 'A',
          room: '302'
        }
      ],
      'Thursday': [
        {
          id: '5',
          startTime: '2:00 PM',
          endTime: '3:00 PM',
          subject: 'Computer Graphics',
          teacher: 'N Zaman',
          className: 'SE_Computer',
          batch: 'B',
          room: 'Lab 1'
        }
      ],
      'Friday': [
        {
          id: '6',
          startTime: '1:00 PM',
          endTime: '2:00 PM',
          subject: 'Database Management',
          teacher: 'M Khan',
          className: 'SE_Computer',
          batch: 'C',
          room: '301'
        }
      ],
      'Saturday': [
        {
          id: '7',
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          subject: 'Operating Systems',
          teacher: 'P Shah',
          className: 'SE_Computer',
          batch: 'A',
          room: 'Lab 2'
        }
      ]
    }
  };

  constructor() { }

  ngOnInit(): void {
    // Initialize with first class
    this.selectedClass = this.classes[0];
    this.selectedBatch = 'All';
  }

  getScheduleForTimeSlot(day: string, timeSlot: string): TimeSlot | null {
    if (!this.selectedClass) return null;

    const daySchedule = this.weeklySchedule[this.selectedClass]?.[day] || [];
    return daySchedule.find(slot => 
      slot.startTime === timeSlot && 
      (this.selectedBatch === 'All' || slot.batch === this.selectedBatch)
    ) || null;
  }

  onClassChange(): void {
    // Reset batch selection when class changes
    this.selectedBatch = 'All';
  }

  getTimeSlotStyle(slot: TimeSlot | null): any {
    if (!slot) return {};

    // Return different background colors based on subject or batch
    const colors: { [key: string]: string } = {
      'Computer Graphics': 'bg-blue-50 border-blue-200',
      'Database Management': 'bg-green-50 border-green-200',
      'Operating Systems': 'bg-purple-50 border-purple-200',
      'Data Structures': 'bg-yellow-50 border-yellow-200'
    };

    return colors[slot.subject] || 'bg-gray-50 border-gray-200';
  }
}
