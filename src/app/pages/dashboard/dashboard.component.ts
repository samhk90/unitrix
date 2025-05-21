import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { BaseService } from '../../services/base.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private baseService: BaseService
  ) { }

  currentDate = new Date();
  isDarkMode = false;
  teacher: any;

  // Class Overview Metrics
  classMetrics = {
    totalClasses: 0,
    totalStudents: 0,
    todayLectures: 0,
    upcomingTests: 0
  };

  ngOnInit() {
    const teacher = localStorage.getItem('teacher');
    if (teacher) {
      this.teacher = JSON.parse(teacher);
      this.loadTeacherMetrics();
    }
  }

  async loadTeacherMetrics() {
    try {
      const teacherData = await this.baseService.getAllTeacherData(this.teacher.teacher_id);
      this.classMetrics.totalClasses = teacherData.classes.length;
      // For now using fixed numbers, in a real app these would come from API
      this.classMetrics.totalStudents = 150;
      this.classMetrics.todayLectures = 3;
      this.classMetrics.upcomingTests = 2;
    } catch (error) {
      console.error('Error loading teacher metrics:', error);
    }
  }

  toggleTheme(isDark: boolean) {
    this.isDarkMode = isDark;
    document.documentElement.classList.toggle('dark', isDark);
  }
}
