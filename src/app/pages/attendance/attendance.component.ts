import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Student {
  rollNo: string;
  name: string;
  status: 'present' | 'absent' | null;
  remarks?: string;
}

interface Lecture {
  id: string;
  teacherName: string;
  department: string;
  subject: string;
  className: string;
  batch: string;
  timeFrom: string;
  students: Student[];
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AttendanceComponent implements OnInit {
  lectures: Lecture[] = [
    {
      id: '1',
      teacherName: 'N Zaman',
      department: 'Computer',
      subject: 'Computer Graphics',
      className: 'SE_Computer',
      batch: 'A',
      timeFrom: '12:30',
      students: [
        { rollNo: 'SE001', name: 'John Doe', status: null },
        { rollNo: 'SE002', name: 'Jane Smith', status: null },
        { rollNo: 'SE003', name: 'Mike Johnson', status: null },
      ]
    },
    {
      id: '2',
      teacherName: 'M Khan',
      department: 'Computer',
      subject: 'Database Management',
      className: 'SE_Computer',
      batch: 'B',
      timeFrom: '14:30',
      students: [
        { rollNo: 'SE004', name: 'Sarah Williams', status: null },
        { rollNo: 'SE005', name: 'David Brown', status: null },
        { rollNo: 'SE006', name: 'Emma Davis', status: null },
      ]
    }
  ];

  selectedLecture: string = '';
  teacherName: string = '';
  department: string = '';
  subject: string = '';
  className: string = '';
  batch: string = '';
  date: string = '';
  timeFrom: string = '';
  timeTo: string = '';
  students: Student[] = [];

  constructor() { }

  ngOnInit(): void {
    // Initialize with empty values
  }

  onLectureSelect(): void {
    if (this.selectedLecture) {
      const lecture = this.lectures.find(l => l.id === this.selectedLecture);
      if (lecture) {
        this.teacherName = lecture.teacherName;
        this.department = lecture.department;
        this.subject = lecture.subject;
        this.className = lecture.className;
        this.batch = lecture.batch;
        this.timeFrom = lecture.timeFrom;
        this.timeTo = lecture.timeFrom; // Same as timeFrom as per previous requirement
        this.students = [...lecture.students]; // Create a new array to avoid reference issues
        this.date = new Date().toISOString().split('T')[0]; // Set today's date
      }
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.teacherName = '';
    this.department = '';
    this.subject = '';
    this.className = '';
    this.batch = '';
    this.date = '';
    this.timeFrom = '';
    this.timeTo = '';
    this.students = [];
  }

  markAllPresent(): void {
    this.students.forEach(student => student.status = 'present');
  }

  markAllAbsent(): void {
    this.students.forEach(student => student.status = 'absent');
  }

  saveDraft(): void {
    console.log('Saving draft...', {
      lectureId: this.selectedLecture,
      teacherName: this.teacherName,
      department: this.department,
      subject: this.subject,
      className: this.className,
      batch: this.batch,
      date: this.date,
      timeFrom: this.timeFrom,
      timeTo: this.timeTo,
      attendance: this.students
    });
    // Implement save draft functionality
  }

  submitAttendance(): void {
    const attendanceData = {
      lectureId: this.selectedLecture,
      teacherName: this.teacherName,
      department: this.department,
      subject: this.subject,
      className: this.className,
      batch: this.batch,
      date: this.date,
      timeFrom: this.timeFrom,
      timeTo: this.timeTo,
      attendance: this.students
    };
    console.log('Submitting attendance:', attendanceData);
    // Implement submit functionality
  }
}
