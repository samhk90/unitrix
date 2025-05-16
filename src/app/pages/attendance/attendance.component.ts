import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Lecture, Student } from '../../services/attendance.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit {
  selectedLecture: string = '';
  lectures: Lecture[] = [];
  students: Student[] = [];
  isLoading = false;

  // Header card data
  teacherName: string = '';
  department: string = '';
  subject: string = '';
  className: string = '';
  batch: string = '';
  timeFrom: string = '';
  timeTo: string = '';
  date: Date = new Date();

  constructor(
    private attendanceService: AttendanceService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadTodayLectures();
  }

  loadTodayLectures() {
    this.isLoading = true;
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    const teacherId = teacher?.teacher_id;
    
    if (!teacherId) {
      this.alertService.error('Teacher ID not found. Please login again.');
      this.isLoading = false;
      return;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    this.attendanceService.getTeacherLectures(teacherId, today).subscribe({
      next: (response) => {
        this.lectures = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.alertService.error(error.error?.message || 'Failed to load lectures');
        this.isLoading = false;
      }
    });
  }

  onLectureSelect() {
    if (!this.selectedLecture) return;

    this.isLoading = true;
    const selectedLectureData = this.lectures.find(l => l.id === this.selectedLecture);
    
    if (selectedLectureData) {
      // Update header card data
      this.teacherName = selectedLectureData.teacherName;
      this.department = selectedLectureData.department;
      this.subject = selectedLectureData.subject;
      this.className = selectedLectureData.className;
      this.batch = selectedLectureData.batch;
      this.timeFrom = selectedLectureData.timeFrom;
      this.timeTo = selectedLectureData.timeTo;
    }

    this.attendanceService.getLectureStudents(this.selectedLecture).subscribe({
      next: (response) => {
        this.students = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.alertService.error(error.error?.message || 'Failed to load students');
        this.isLoading = false;
      }
    });
  }

  markAllPresent() {
    this.students = this.students.map(student => ({
      ...student,
      status: 'present'
    }));
  }

  markAllAbsent() {
    this.students = this.students.map(student => ({
      ...student,
      status: 'absent'
    }));
  }

  submitAttendance() {
    if (!this.selectedLecture || this.students.length === 0) {
      this.alertService.error('No students or lecture selected');
      return;
    }

    this.isLoading = true;
    const attendanceData = this.students.map(student => ({
      student_id: student.id,
      status: student.status
    }));

    const today = new Date().toISOString().split('T')[0];

    this.attendanceService.submitAttendance(this.selectedLecture, attendanceData, today).subscribe({
      next: (response) => {
        this.alertService.success('Attendance submitted successfully');
        this.selectedLecture = '';
        this.students = [];
        this.isLoading = false;
      },
      error: (error) => {
        this.alertService.error(error.error?.message || 'Failed to submit attendance');
        this.isLoading = false;
      }
    });
  }
}
