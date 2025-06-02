import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TimetableService, ClassTimetableData, ClassTimetableSlot } from '../../services/timetable.service';
import { ReportService, DepartmentClass } from '../../services/report.service';

@Component({
  selector: 'app-class-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-timetable.component.html',
  styleUrls: ['../timetable/timetable.component.css']
})
export class ClassTimetableComponent implements OnInit {
  isLoading = false;
  error: string | null = null;
  timetableData: ClassTimetableData | null = null;
  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  timeSlots: { start_time: string; end_time: string }[] = [];
  
  // Class selection
  departmentClasses: DepartmentClass[] = [];
  selectedClassId: string = '';

  constructor(
    private timetableService: TimetableService,
    private reportService: ReportService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    
    // If we have a class ID in the route params, load that timetable
    this.route.params.subscribe(params => {
      if (params['classId']) {
        this.selectedClassId = params['classId'];
        this.loadTimetable(params['classId']);
      }
    });
  }

  private loadClasses() {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    const teacherId = teacher?.teacher_id;
    
    if (!teacherId) {
      this.error = 'Teacher ID not found. Please login again.';
      return;
    }

    this.reportService.getDepartmentClasses(teacherId).subscribe({
      next: (response) => {
        this.departmentClasses = response.data;
        if (!this.selectedClassId && this.departmentClasses.length > 0) {
          this.selectedClassId = this.departmentClasses[0].id;
          this.loadTimetable(this.selectedClassId);
        }
      },
      error: (error) => {
        this.error = 'Failed to load classes';
        console.error('Error loading classes:', error);
      }
    });
  }

  onClassChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const classId = select.value;
    if (classId) {
      this.selectedClassId = classId;
      this.loadTimetable(classId);
      this.router.navigate(['/academics/class-timetable', classId], {
        replaceUrl: true
      });
    }
  }

  private loadTimetable(classId: string) {
    this.isLoading = true;
    this.error = null;
    
    console.log('Loading timetable for class:', classId);
    
    this.timetableService.getClassTimetable(classId).subscribe({
      next: (response) => {
        console.log('Raw API Response:', response);
        console.log('Response type:', typeof response);
        console.log('Response structure:', Object.keys(response));
        
        if ('data' in response) {
          const data = response.data;
          console.log('Data from response:', data);
          console.log('Data type:', typeof data);
          
          if (this.isClassTimetableData(data)) {
            console.log('Timetable Structure:', data.timetable);
            console.log('Timetable days:', Object.keys(data.timetable));
            
            // Log a sample day's data
            const sampleDay = Object.keys(data.timetable)[0];
            if (sampleDay) {
              console.log(`Sample day (${sampleDay}) data:`, data.timetable[sampleDay]);
            }
            
            this.timetableData = data;
            const allSlots = Object.values(this.timetableData.timetable)
              .flatMap(daySlots => Object.values(daySlots));
            console.log('All slots flattened:', allSlots);
            this.extractTimeSlots(allSlots);
          } else {
            this.error = 'Invalid timetable data format';
            console.error('Invalid timetable data structure:', data);
          }
        } else {
          console.error('Response missing data property:', response);
          this.error = 'Invalid API response format';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load timetable';
        console.error('Error loading timetable:', error);
        this.isLoading = false;
      }
    });
  }

  private isClassTimetableData(data: any): data is ClassTimetableData {
    return (
      data &&
      typeof data === 'object' &&
      'class_info' in data &&
      'timetable' in data
    );
  }

  private extractTimeSlots(data: any[]) {
    console.log('Starting to extract time slots from raw data:', data);
    
    const uniqueSlots = new Map<string, { start_time: string, end_time: string }>();
    
    if (this.timetableData?.timetable) {
        // Process each day's slots
        Object.entries(this.timetableData.timetable).forEach(([day, slots]) => {
            console.log(`Processing ${day}:`, slots);
            
            if (Array.isArray(slots)) {
                slots.forEach((slotData: any) => {
                    // Log each slot for debugging
                    console.log('Processing slot:', slotData);
                    
                    // Handle the nested slot structure
                    const slot = slotData?.slot || slotData;
                    
                    if (slot && typeof slot === 'object') {
                        const start = slot.start_time;
                        const end = slot.end_time;
                        
                        if (start && end) {
                            const normalizedStart = this.normalizeTime(start);
                            const normalizedEnd = this.normalizeTime(end);
                            
                            const key = `${normalizedStart}-${normalizedEnd}`;
                            if (!uniqueSlots.has(key)) {
                                uniqueSlots.set(key, {
                                    start_time: normalizedStart,
                                    end_time: normalizedEnd
                                });
                                console.log(`Added time slot: ${key}`, { start: normalizedStart, end: normalizedEnd });
                            }
                        } else {
                            console.log('Slot missing time values:', slot);
                        }
                    } else {
                        console.log('Invalid slot structure:', slotData);
                    }
                });
            }
        });
    }

    // Sort time slots by start time
    this.timeSlots = Array.from(uniqueSlots.values())
        .sort((a, b) => {
            const aMinutes = this.convertTo24Hour(a.start_time);
            const bMinutes = this.convertTo24Hour(b.start_time);
            return aMinutes - bMinutes;
        });

    console.log('Final sorted time slots:', this.timeSlots);
}

  private compareTimeStrings(timeA: string, timeB: string): number {
    const convertToMinutes = (timeStr: string) => {
      const [time, meridiem] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };

    return convertToMinutes(timeA) - convertToMinutes(timeB);
  }

getScheduleForTimeSlot(day: string, timeSlot: { start_time: string; end_time: string }): ClassTimetableSlot[] {
    if (!timeSlot || !this.timetableData?.timetable) {
        console.log('No timeSlot or timetable data');
        return [];
    }

    const daySchedule = this.timetableData.timetable[day];
    if (!daySchedule || !Array.isArray(daySchedule)) {
        console.log(`No schedule found for day: ${day}`);
        return [];
    }

    const matchingSlots: ClassTimetableSlot[] = [];
    
    // Log the time slot we're looking for
    console.log(`Looking for slots matching:`, {
        day,
        timeSlot: `${timeSlot.start_time} - ${timeSlot.end_time}`
    });

    daySchedule.forEach(slotData => {
        // Handle the nested slot structure
        const slot = slotData?.slot || slotData;
        
        if (!slot || !slot.start_time || !slot.end_time) {
            console.log('Skipping invalid slot:', slotData);
            return;
        }

        // Log each slot we're checking
        console.log('Checking slot:', {
            start: slot.start_time,
            end: slot.end_time,
            subject: slotData.subject?.name,
            type: slotData.subject?.type
        });

        const normalizedSlotStart = this.normalizeTime(slot.start_time);
        const normalizedSlotEnd = this.normalizeTime(slot.end_time);
        const normalizedTargetStart = this.normalizeTime(timeSlot.start_time);
        const normalizedTargetEnd = this.normalizeTime(timeSlot.end_time);

        const exactTimeMatch = 
            normalizedSlotStart === normalizedTargetStart && 
            normalizedSlotEnd === normalizedTargetEnd;

        const isPractical = slotData.subject?.type === 'Practical';
        const slotStartMinutes = this.convertTo24Hour(normalizedSlotStart);
        const slotEndMinutes = this.convertTo24Hour(normalizedSlotEnd);
        const targetStartMinutes = this.convertTo24Hour(normalizedTargetStart);
        const targetEndMinutes = this.convertTo24Hour(normalizedTargetEnd);

        const hasOverlap = isPractical && (
            (slotStartMinutes <= targetStartMinutes && targetStartMinutes < slotEndMinutes) ||
            (slotStartMinutes < targetEndMinutes && targetEndMinutes <= slotEndMinutes) ||
            (targetStartMinutes <= slotStartMinutes && slotEndMinutes <= targetEndMinutes)
        );

        if (exactTimeMatch || hasOverlap) {
            console.log('Found matching slot:', {
                match: exactTimeMatch ? 'exact' : 'overlap',
                slot: slotData
            });
            
            matchingSlots.push({
                start_time: slot.start_time,
                end_time: slot.end_time,
                subject: slotData.subject,
                teacher: slotData.teacher,
                batch_name: slotData.batch_name || slotData.batch || ''
            });
        }
    });

    return matchingSlots;
}
  getTimeSlotStyle(slots: any[]) {
    if (!slots || slots.length === 0) return '';

    const hasTheory = slots.some(slot => slot.subject.type === 'Theory');
    const hasPractical = slots.some(slot => slot.subject.type === 'Practical');

    if (hasTheory && hasPractical) return 'bg-purple-50';
    if (hasTheory) return 'bg-green-50';
    if (hasPractical) return 'bg-blue-50';
    return '';
  }
  switchToTeacherView() {
    this.router.navigate(['/academics/timetable']);
  }

  private convertTo24Hour(time12h: string): number {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    let hoursNum = parseInt(hours, 10);
    if (modifier === 'PM' && hoursNum < 12) hoursNum += 12;
    if (modifier === 'AM' && hoursNum === 12) hoursNum = 0;
    
    return hoursNum * 60 + parseInt(minutes, 10);
  }

  private normalizeTime(time: string | undefined): string {
    if (!time) return '';
    // Ensure consistent 12-hour time format with space before AM/PM
    const [timeStr, meridiem] = time.split(/\s*(AM|PM)\s*/i);
    return `${timeStr} ${meridiem.toUpperCase()}`;
  }
}
