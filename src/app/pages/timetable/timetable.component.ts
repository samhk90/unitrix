import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgLetDirective } from '../../shared/directives/ng-let.directive';
import { TimetableService, TimetableEntry, ClassTimetableData } from '../../services/timetable.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, NgLetDirective],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit {
  isLoading: boolean = false;
  error: string | null = null;
  timetableData: TimetableEntry[] = [];
  timeSlots: { start_time: string, end_time: string }[] = [];
  weekDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  viewMode: 'teacher' | 'class' = 'teacher';
  selectedClassId: string | null = null;

  constructor(
    private timetableService: TimetableService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTimetable();
  }

  private isClassTimetableData(data: TimetableEntry[] | ClassTimetableData): data is ClassTimetableData {
    return (data as ClassTimetableData).class_info !== undefined && 
           (data as ClassTimetableData).timetable !== undefined;
  }

  private isTimetableEntryArray(data: TimetableEntry[] | ClassTimetableData): data is TimetableEntry[] {
    return Array.isArray(data);
  }

  switchView(mode: 'teacher' | 'class', classId?: string) {
    if (mode === 'class' && classId) {
      // Navigate to class timetable view
      this.router.navigate(['/academics/class-timetable', classId]);
    } else {
      this.viewMode = 'teacher';
      this.selectedClassId = null;
      this.loadTimetable();
    }
  }

  loadTimetable() {
    this.isLoading = true;
    this.error = null;
    this.timetableData = []; // Clear existing data
    this.timeSlots = []; // Clear existing time slots
    
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    const teacherId = teacher?.teacher_id;
    
    if (!teacherId) {
      this.error = 'Teacher ID not found. Please login again.';
      this.isLoading = false;
      return;
    }

    console.log('Loading timetable for teacher:', teacherId);

    this.timetableService.getTimetableByTeacher(teacherId)
      .subscribe({
        next: (response) => {
          console.log('Teacher timetable response:', response);

          if (!response.data) {
            this.error = 'No timetable data received';
            console.error('No data in response:', response);
            this.isLoading = false;
            return;
          }

          if (this.isTimetableEntryArray(response.data)) {
            // Handle TimetableEntry[] format
            this.timetableData = response.data.map(entry => ({
              ...entry,
              day: entry.day.toLowerCase()
            }));
          } else if (this.isClassTimetableData(response.data)) {
            // Handle ClassTimetableData format
            const classTimetable = response.data;
            
            // Convert ClassTimetableData to TimetableEntry[] format
            const entries: TimetableEntry[] = [];
            
            // Get all unique slot IDs from all days
            const allSlotIds = new Set<string>();
            Object.values(classTimetable.timetable).forEach(daySchedule => {
              Object.keys(daySchedule).forEach(slotId => allSlotIds.add(slotId));
            });

            // For each day and slot, create TimetableEntry
            Object.entries(classTimetable.timetable).forEach(([day, slots]) => {
              allSlotIds.forEach(slotId => {
                const slot = slots[slotId];
                if (slot) {
                  entries.push({
                    timetable_id: parseInt(slotId), // Using slotId as timetable_id
                    day: day.toLowerCase(),
                    class: classTimetable.class_info,
                    batch_name: slot.batch_name || '',
                    slot: {
                      id: parseInt(slotId),
                      start_time: slot.start_time,
                      end_time: slot.end_time
                    },
                    subject: slot.subject,
                    teacher: slot.teacher
                  });
                }
              });
            });
            
            this.timetableData = entries;
          } else {
            this.error = 'Invalid timetable data received';
            console.error('Invalid timetable data:', response.data);
            this.isLoading = false;
            return;
          }

          // Extract time slots after setting timetableData
          this.extractTimeSlots(this.timetableData);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load timetable. Please try again later.';
          console.error('Error loading timetable:', error);
          this.isLoading = false;
        }
      });
  }

  private extractTimeSlots(data: TimetableEntry[]) {
    console.log('Starting to extract time slots from data:', data);
    
    // Ensure data is an array and has items
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      return;
    }
    
    if (data.length === 0) {
      console.warn('No timetable data to process');
      return;
    }

    // Extract unique time slots and sort them
    const uniqueSlots = new Map<string, { start_time: string, end_time: string }>();
    
    data.forEach((entry, index) => {
      if (!entry?.slot) {
        console.warn('Entry missing slot:', entry);
        return;
      }
      
      if (!entry.slot.start_time || !entry.slot.end_time) {
        console.warn('Slot missing time:', entry.slot);
        return;
      }

      // Normalize time format to ensure consistent matching
      const startTime = this.normalizeTimeFormat(entry.slot.start_time);
      const endTime = this.normalizeTimeFormat(entry.slot.end_time);
      
      const key = `${startTime}-${endTime}`;
      console.log(`Adding slot with key: ${key}`, entry);
      uniqueSlots.set(key, {
        start_time: startTime,
        end_time: endTime
      });
    });

    console.log('Unique slots map:', uniqueSlots);
    
    // Convert to array and sort by start time
    this.timeSlots = Array.from(uniqueSlots.values())
      .sort((a, b) => this.convertTo24Hour(a.start_time) - this.convertTo24Hour(b.start_time));

    console.log('Final extracted and sorted time slots:', this.timeSlots);
  }

  private normalizeTimeFormat(time: string): string {
    // Handle null or undefined
    if (!time) return '';
    
    // Remove extra spaces and convert to uppercase
    const cleanTime = time.trim().toUpperCase();
    
    // Extract time and meridiem parts, handling different formats
    const matches = cleanTime.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
    if (!matches) {
        console.warn('Invalid time format:', time);
        return time; // Return original if format is unrecognized
    }
    
    let [_, hours, minutes = '00', meridiem] = matches;
    
    // Ensure two digits for hours and minutes
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    
    // Assume AM if meridiem is missing and hours < 12
    if (!meridiem) {
        meridiem = parseInt(hours) < 12 ? 'AM' : 'PM';
    }
    
    return `${hours}:${minutes} ${meridiem}`;
  }

  private convertTo24Hour(time12h: string): number {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    let hoursNum = parseInt(hours, 10);
    if (modifier === 'PM' && hoursNum < 12) hoursNum += 12;
    if (modifier === 'AM' && hoursNum === 12) hoursNum = 0;
    
    return hoursNum * 60 + parseInt(minutes, 10);
  }

  getScheduleForTimeSlot(day: string, timeSlot: { start_time: string, end_time: string }): TimetableEntry[] {
    if (!timeSlot || !this.timetableData?.length) {
      console.log('No timeSlot or timetableData:', { timeSlot, dataLength: this.timetableData?.length });
      return [];
    }
    
    const normalizedDay = day.toLowerCase();
    const normalizedStartTime = this.normalizeTimeFormat(timeSlot.start_time);
    const normalizedEndTime = this.normalizeTimeFormat(timeSlot.end_time);
    
    console.log(`Looking for slots on ${normalizedDay} at ${normalizedStartTime} - ${normalizedEndTime}`);
    
    const matchingSlots = this.timetableData.filter(entry => {
        if (!entry?.slot || !entry.day) {
            console.log('Invalid entry:', entry);
            return false;
        }
        
        const dayMatches = entry.day.toLowerCase() === normalizedDay;
        const entryStartTime = this.normalizeTimeFormat(entry.slot.start_time);
        const entryEndTime = this.normalizeTimeFormat(entry.slot.end_time);
        
        // Debug time comparisons
        if (dayMatches) {
            console.log('Time comparison:', {
                slot: `${normalizedStartTime}-${normalizedEndTime}`,
                entry: `${entryStartTime}-${entryEndTime}`,
                startMatch: entryStartTime === normalizedStartTime,
                endMatch: entryEndTime === normalizedEndTime
            });
        }
        
        const timeMatches = 
            entryStartTime === normalizedStartTime &&
            entryEndTime === normalizedEndTime;
        
        if (dayMatches && timeMatches) {
            console.log('Found matching slot:', entry);
        }
        
        return dayMatches && timeMatches;
    });
    
    console.log(`Found ${matchingSlots.length} slots for ${normalizedDay} at ${normalizedStartTime} - ${normalizedEndTime}`);
    return matchingSlots;
  }

  getTimeSlotStyle(slots: TimetableEntry[]): string {
    if (!slots || slots.length === 0) return '';

    // If all slots are of the same type, use that color
    const allPractical = slots.every(slot => slot?.subject?.type === 'Practical');
    const allTheory = slots.every(slot => slot?.subject?.type === 'Theory');

    if (allPractical) return 'bg-blue-100 border-blue-200';
    if (allTheory) return 'bg-green-100 border-green-200';

    // If mixed types, use a different color
    return 'bg-purple-100 border-purple-200';
  }
}
