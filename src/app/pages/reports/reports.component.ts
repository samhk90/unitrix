import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as Papa from 'papaparse';
import { ReportService } from '../../services/report.service';
import type { 
  DepartmentClass, 
  TeacherSubject, 
  DailyAttendanceResponse,
  WeeklyAttendanceResponse,
  MonthlyAttendanceResponse,
  SubjectAttendanceResponse,
  CustomAttendanceResponse
} from '../../services/report.service';
import { firstValueFrom } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  @ViewChild('attendanceChart', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Class selection
  selectedClass: string = '';
  classes: DepartmentClass[] = [];

  // Report type
  reportType: 'daily' | 'weekly' | 'monthly' | 'subject-wise' | 'custom' = 'daily';
  
  // Subject selection
  selectedSubject: string = '';
  subjects: TeacherSubject[] = [];

  // Date selections for different report types
  selectedDate: string = '';
  selectedWeek: string = '';
  selectedMonth: string = '';
  customStartDate: string = '';
  customEndDate: string = '';

  // Report data based on type
  dailyReport: DailyAttendanceResponse | null = null;
  weeklyReport: WeeklyAttendanceResponse | null = null;
  monthlyReport: MonthlyAttendanceResponse | null = null;
  subjectReport: SubjectAttendanceResponse | null = null;
  customReport: CustomAttendanceResponse | null = null;

  // UI state
  isGenerating: boolean = false;
  private chart: Chart | null = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadTeacherData();
  }

  private async loadTeacherData(): Promise<void> {
    try {
      // Use hardcoded teacher ID for now - in real app this would come from auth service
      const teacher=JSON.parse(localStorage.getItem('teacher') || '{}');
      const teacherId = teacher.teacher_id;
      
      // Get teacher's assigned classes
      const classesResponse = await firstValueFrom(this.reportService.getDepartmentClasses(teacherId));
      this.classes = classesResponse?.data || [];

      // Get teacher's subjects
      const subjects = await firstValueFrom(this.reportService.getTeacherSubjects(teacherId));
      this.subjects = subjects || [];
      
    } catch (error) {
      console.error('Error loading teacher data:', error);
      alert('Failed to load teacher data. Please refresh the page.');
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private destroyChart(): void {
    if (this.chart instanceof Chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  onReportTypeChange(): void {
    // Reset data when report type changes
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.customStartDate = '';
    this.customEndDate = '';
    this.dailyReport = null;
    this.weeklyReport = null;
    this.monthlyReport = null;
    this.subjectReport = null;
    this.customReport = null;
    this.destroyChart();
  }

  async generateReport(): Promise<void> {
    if (!this.selectedClass) {
      alert('Please select a class');
      return;
    }

    this.isGenerating = true;
    this.destroyChart();

    try {
      switch (this.reportType) {
        case 'daily':
          this.dailyReport = await firstValueFrom(this.reportService.getDailyAttendance({
            classId: this.selectedClass,
            date: this.selectedDate,
            subjectId: this.selectedSubject
          }));
          setTimeout(() => this.initializeChart(), 0);
          break;

        case 'weekly':
          this.weeklyReport = await firstValueFrom(this.reportService.getWeeklyAttendance({
            classId: this.selectedClass,
            date: this.selectedDate,
            subjectId: this.selectedSubject
          }));
          setTimeout(() => this.initializeChart(), 0);
          break;

        case 'monthly':
          if (!this.selectedMonth) {
            alert('Please select a month');
            return;
          }
          this.monthlyReport = await firstValueFrom(this.reportService.getMonthlyAttendance({
            classId: this.selectedClass,
            date: this.selectedMonth + '-01', // First day of selected month
            subjectId: this.selectedSubject
          }));
          setTimeout(() => this.initializeChart(), 0);
          break;

        case 'subject-wise':
          if (!this.selectedSubject) {
            alert('Please select a subject');
            return;
          }
          this.subjectReport = await firstValueFrom(this.reportService.getSubjectAttendance({
            classId: this.selectedClass,
            subjectId: this.selectedSubject
          }));
          setTimeout(() => this.initializeChart(), 0);
          break;

        case 'custom':
          if (!this.customStartDate || !this.customEndDate) {
            alert('Please select start and end dates');
            return;
          }
          this.customReport = await firstValueFrom(this.reportService.getCustomAttendance({
            classId: this.selectedClass,
            startDate: this.customStartDate,
            endDate: this.customEndDate,
            subjectId: this.selectedSubject
          }));
          setTimeout(() => this.initializeChart(), 0);
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      this.isGenerating = false;
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas?.nativeElement) {
      console.warn('Chart canvas element not found, waiting for next render cycle');
      return;
    }

    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context from canvas');
      return;
    }

    let data: ChartConfiguration['data'];
    let title: string = '';

    switch (this.reportType) {
      case 'daily': {
        if (!this.dailyReport) return;
        // Show bar graph for daily attendance
        data = {
          labels: ['Present', 'Absent'],
          datasets: [{
            label: 'Number of Students',
            data: [this.dailyReport.stats.present, this.dailyReport.stats.absent],
            backgroundColor: [
              'rgba(34, 197, 94, 0.6)',  // Green for present
              'rgba(239, 68, 68, 0.6)'   // Red for absent
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(239, 68, 68)'
            ],
            borderWidth: 1,
            barThickness: 60
          }]
        };
        title = `Daily Attendance Overview (${this.dailyReport.date})`;
        break;
      }

      case 'weekly': {
        if (!this.weeklyReport) return;
        // Line graph for weekly trend
        // Create array of days for the week
        const startDate = new Date(this.weeklyReport.week.start);
        const endDate = new Date(this.weeklyReport.week.end);
        const days = [];
        const presentCounts = new Array(7).fill(0);
        const absentCounts = new Array(7).fill(0);
        
        // Generate array of days
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        }

        // Calculate daily totals
        this.weeklyReport.weeklyStats.forEach(stat => {
          const daysAttended = Math.min(stat.presentDays, days.length);
          const daysAbsent = Math.min(stat.absentDays, days.length);
          
          // Distribute present days across the week
          for (let i = 0; i < daysAttended; i++) {
            presentCounts[i]++;
          }
          // Distribute absent days across the week
          for (let i = 0; i < daysAbsent; i++) {
            absentCounts[i]++;
          }
        });

        data = {
          labels: days,
          datasets: [
            {
              label: 'Present Students',
              data: presentCounts,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Absent Students',
              data: absentCounts,
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };
        title = `Weekly Attendance Trend (${this.weeklyReport.week.start} to ${this.weeklyReport.week.end})`;
        break;
      }

      case 'monthly': {
        if (!this.monthlyReport) return;
        // Line graph for monthly trend
        const startDate = new Date(this.monthlyReport.month.start);
        const endDate = new Date(this.monthlyReport.month.end);
        const weeks = [];
        const attendanceData = [];
        
        // Generate array of week ranges
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weeks.push(`Week ${Math.ceil(currentDate.getDate() / 7)}`);
          
          // Calculate average attendance for this week
          const weekStats = this.monthlyReport.monthlyStats.reduce((acc, stat) => {
            const weekAttendance = (stat.presentDays / stat.totalDays) * 100;
            return acc + weekAttendance;
          }, 0) / this.monthlyReport.monthlyStats.length;
          
          attendanceData.push(weekStats);
          
          currentDate.setDate(currentDate.getDate() + 7);
        }

        data = {
          labels: weeks,
          datasets: [{
            label: 'Average Attendance %',
            data: attendanceData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
        title = `Monthly Attendance Trend (${this.monthlyReport.month.start} to ${this.monthlyReport.month.end})`;
        break;
      }

      case 'subject-wise': {
        if (!this.subjectReport) return;
        // Line graph for subject-wise trend
        data = {
          labels: this.subjectReport.studentStats.map(s => s.name),
          datasets: [{
            label: 'Attendance Percentage',
            data: this.subjectReport.studentStats.map(s => s.percentage),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
        title = `Subject-wise Attendance Trend - ${this.subjectReport.subject}`;
        break;
      }

      case 'custom': {
        if (!this.customReport) return;
        // Line graph for custom period trend
        data = {
          labels: this.customReport.studentStats.map(s => s.name),
          datasets: [{
            label: 'Attendance Percentage',
            data: this.customReport.studentStats.map(s => 
              (s.presentDays / (s.presentDays + s.absentDays) * 100)
            ),
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        };
        title = `Custom Period Attendance Trend (${this.customReport.dateRange.start} to ${this.customReport.dateRange.end})`;
        break;
      }

      default:
        return;
    }

    if (!data) {
      console.warn('No data available for chart');
      return;
    }

    try {
      this.chart = new Chart(ctx, {
        type: this.reportType === 'daily' ? 'bar' : 'line',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 20
            }
          },
          plugins: {
            title: {
              display: true,
              text: title,
              font: { size: 16, weight: 'bold' },
              padding: {
                top: 10,
                bottom: 30
              }
            },
            legend: {
              position: 'top',
              display: true,
              labels: {
                padding: 20,
                boxWidth: 15,
                font: { size: 12 }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: this.reportType === 'daily' ? 'Number of Students' : 'Attendance Percentage (%)',
                font: { size: 12, weight: 'bold' }
              }
            },
            x: {
              title: {
                display: true,
                text: (() => {
                  switch(this.reportType) {
                    case 'daily': return 'Attendance Status';
                    case 'weekly': return 'Days of the Week';
                    case 'monthly': return 'Weeks of the Month';
                    default: return 'Students';
                  }
                })(),
                font: { size: 12, weight: 'bold' }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    let title: string;
    let data: any[][] = [];
    let headers: string[] = [];

    // Set up data based on report type
    switch (this.reportType) {
      case 'daily': {
        if (!this.dailyReport) return;
        title = `Daily Attendance Report - ${this.dailyReport.date}`;
        headers = ['Roll No', 'Name', 'Status'];
        data = this.dailyReport.students.map(s => [
          s.rollNo,
          s.name,
          s.status
        ]);
        break;
      }

      case 'weekly': {
        if (!this.weeklyReport) return;
        title = `Weekly Attendance Report (${this.weeklyReport.week.start} to ${this.weeklyReport.week.end})`;
        headers = ['Roll No', 'Name', 'Present Days', 'Absent Days', 'Percentage'];
        data = this.weeklyReport.weeklyStats.map(s => [
          s.rollNo,
          s.name,
          s.presentDays,
          s.absentDays,
          `${s.percentage}%`
        ]);
        break;
      }

      case 'monthly': {
        if (!this.monthlyReport) return;
        title = `Monthly Attendance Report (${this.monthlyReport.month.start} to ${this.monthlyReport.month.end})`;
        headers = ['Roll No', 'Name', 'Total Days', 'Present Days', 'Absent Days', 'Percentage'];
        data = this.monthlyReport.monthlyStats.map(s => [
          s.rollNo,
          s.name,
          s.totalDays,
          s.presentDays,
          s.absentDays,
          `${s.percentage}%`
        ]);
        break;
      }

      case 'subject-wise': {
        if (!this.subjectReport) return;
        title = `Subject Attendance Report - ${this.subjectReport.subject}`;
        headers = ['Roll No', 'Name', 'Total Lectures', 'Attended', 'Percentage'];
        data = this.subjectReport.studentStats.map(s => [
          s.rollNo,
          s.name,
          s.totalLectures,
          s.attended,
          `${s.percentage}%`
        ]);
        break;
      }

      case 'custom': {
        if (!this.customReport) return;
        title = `Custom Period Attendance Report (${this.customReport.dateRange.start} to ${this.customReport.dateRange.end})`;
        headers = ['Roll No', 'Name', 'Present Days', 'Absent Days', 'Percentage'];
        data = this.customReport.studentStats.map(s => [
          s.rollNo,
          s.name,
          s.presentDays,
          s.absentDays,
          `${s.percentage}%`
        ]);
        break;
      }

      default:
        return;
    }

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 25,
    });

    // Add chart if it exists
    if (this.chart) {
      const chartImage = this.chartCanvas.nativeElement.toDataURL('image/png');
      const pageHeight = doc.internal.pageSize.height;
      const finalY = (doc as any).lastAutoTable.finalY || 25;
      
      if (finalY + 100 > pageHeight) {
        doc.addPage();
        doc.text('Attendance Overview Chart', 14, 15);
        doc.addImage(chartImage, 'PNG', 10, 25, 190, 100);
      } else {
        doc.text('Attendance Overview Chart', 14, finalY + 10);
        doc.addImage(chartImage, 'PNG', 10, finalY + 20, 190, 100);
      }
    }

    // Save the PDF
    const fileName = `attendance-report-${this.reportType}-${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  exportToCSV(): void {
    let data: any[][] = [];
    let headers: string[] = [];

    // Set up data based on report type
    switch (this.reportType) {
      case 'daily': {
        if (!this.dailyReport) return;
        headers = ['Roll No', 'Name', 'Status'];
        data = this.dailyReport.students.map(s => [
          s.rollNo,
          s.name,
          s.status
        ]);
        break;
      }

      case 'weekly': {
        if (!this.weeklyReport) return;
        headers = ['Roll No', 'Name', 'Present Days', 'Absent Days', 'Percentage'];
        data = this.weeklyReport.weeklyStats.map(s => [
          s.rollNo,
          s.name,
          s.presentDays,
          s.absentDays,
          s.percentage
        ]);
        break;
      }

      case 'monthly': {
        if (!this.monthlyReport) return;
        headers = ['Roll No', 'Name', 'Total Days', 'Present Days', 'Absent Days', 'Percentage'];
        data = this.monthlyReport.monthlyStats.map(s => [
          s.rollNo,
          s.name,
          s.totalDays,
          s.presentDays,
          s.absentDays,
          s.percentage
        ]);
        break;
      }

      case 'subject-wise': {
        if (!this.subjectReport) return;
        headers = ['Roll No', 'Name', 'Total Lectures', 'Attended', 'Percentage'];
        data = this.subjectReport.studentStats.map(s => [
          s.rollNo,
          s.name,
          s.totalLectures,
          s.attended,
          s.percentage
        ]);
        break;
      }

      case 'custom': {
        if (!this.customReport) return;
        headers = ['Roll No', 'Name', 'Present Days', 'Absent Days', 'Percentage'];
        data = this.customReport.studentStats.map(s => [
          s.rollNo,
          s.name,
          s.presentDays,
          s.absentDays,
          s.percentage
        ]);
        break;
      }

      default:
        return;
    }

    // Configure Papa Parse options
    const csv = Papa.unparse({
      fields: headers,
      data: data
    }, {
      delimiter: ',',
      header: true,
      newline: '\r\n'
    });

    // Create and download the file
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-report-${this.reportType}-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
