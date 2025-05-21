import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgLetDirective } from '../../shared/directives/ng-let.directive';
import { TimetableService } from '../../services/timetable.service';
import { FormsModule } from '@angular/forms';

interface TimeSlot {
  timetable_id: number;
  day: string;
  subject: {
    id: number;
    name: string;
    type: string;
  };
  slot: {
    id: number;
    start_time: string;
    end_time: string;
  };
  class: {
    id: number;
    name: string;
    department: {
      id: number;
      name: string;
    };
  };
  batch_name: string;
  teacher: {
    id: string;
    name: string;
    department: {
      id: number;
      name: string;
    };
  };
}

@Component({
  selector: 'app-hod-timetable',
  standalone: true,
  imports: [CommonModule, NgLetDirective, FormsModule],
  templateUrl: './hod-timetable.component.html',
  styles: []
})
export class HodTimetableComponent implements OnInit {
  isLoading: boolean = false;
  error: string | null = null;
  timetableData: TimeSlot[] = [];
  timeSlots: { start_time: string, end_time: string }[] = [];
  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  selectedClass: string = 'all';
  classes: { id: number, name: string }[] = [];

  constructor(private timetableService: TimetableService) {}

  ngOnInit(): void {
    this.loadTimetable();
  }

  loadTimetable() {
    this.isLoading = true;
    this.error = null;
    
    const hod = JSON.parse(localStorage.getItem('teacher') || '{}');
    const departmentId = hod?.department?.id;
    
    if (!departmentId) {
      this.error = 'Department ID not found. Please login again.';
      this.isLoading = false;
      return;
    }

    this.timetableService.getTimetableByDepartment(departmentId)
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.timetableData = response.data;
            this.extractTimeSlots(response.data);
            this.extractClasses(response.data);
          } else {
            this.error = 'Invalid timetable data received';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load timetable. Please try again later.';
          console.error('Error loading timetable:', error);
          this.isLoading = false;
        }
      });
  }

  private extractTimeSlots(data: TimeSlot[]) {
    const uniqueSlots = new Map<string, { start_time: string, end_time: string }>();
    
    data.forEach(entry => {
      const key = `${entry.slot.start_time}-${entry.slot.end_time}`;
      uniqueSlots.set(key, {
        start_time: entry.slot.start_time,
        end_time: entry.slot.end_time
      });
    });

    this.timeSlots = Array.from(uniqueSlots.values())
      .sort((a, b) => {
        return this.convertTo24Hour(a.start_time) - this.convertTo24Hour(b.start_time);
      });
  }

  private extractClasses(data: TimeSlot[]) {
    const uniqueClasses = new Map<number, { id: number, name: string }>();
    
    data.forEach(entry => {
      uniqueClasses.set(entry.class.id, {
        id: entry.class.id,
        name: entry.class.name
      });
    });

    this.classes = Array.from(uniqueClasses.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private convertTo24Hour(time12h: string): number {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    let hoursNum = parseInt(hours, 10);
    if (modifier === 'PM' && hoursNum < 12) hoursNum += 12;
    if (modifier === 'AM' && hoursNum === 12) hoursNum = 0;
    
    return hoursNum * 60 + parseInt(minutes, 10);
  }

  getScheduleForTimeSlot(day: string, timeSlot: { start_time: string, end_time: string }): TimeSlot[] {
    return this.timetableData.filter(slot => 
      slot.day === day && 
      slot.slot.start_time === timeSlot.start_time &&
      slot.slot.end_time === timeSlot.end_time &&
      (this.selectedClass === 'all' || slot.class.id.toString() === this.selectedClass)
    );
  }

  getTimeSlotStyle(slots: TimeSlot[]): string {
    if (!slots || slots.length === 0) return '';

    const allPractical = slots.every(slot => slot.subject.type === 'Practical');
    const allTheory = slots.every(slot => slot.subject.type === 'Theory');

    if (allPractical) return 'bg-blue-100 border-blue-200';
    if (allTheory) return 'bg-green-100 border-green-200';

    return 'bg-purple-100 border-purple-200';
  }

  onClassChange() {
    // Re-render timetable when class filter changes
    this.error = null;
  }
}