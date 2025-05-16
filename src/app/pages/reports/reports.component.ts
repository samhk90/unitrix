import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as Papa from 'papaparse';
import { ReportService } from '../../services/report.service';
import type { DepartmentClass, TeacherSubject, AttendanceReport } from '../../services/report.service';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('attendanceChart') chartCanvas!: ElementRef;

  // Form selections
  selectedClass: string = '';
  selectedSubject: string = '';
  reportType: 'daily' | 'weekly' | 'monthly' | 'subject-wise' | 'custom' = 'daily';
  selectedDate: string = '';
  selectedWeek: string = '';
  selectedMonth: string = '';
  customStartDate: string = '';
  customEndDate: string = '';

  // Data from service
  classes: DepartmentClass[] = [];
  subjects: TeacherSubject[] = [];
  currentTeacherId: string = '';

  // Report data
  reportHeaders: string[] = [];
  reportData: any[][] = [];
  chart: Chart | null = null;
  isGenerating: boolean = false;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadTeacherData();
  }

  ngAfterViewInit(): void {
    if (this.reportData.length > 0) {
      this.initializeChart();
    }
  }

  private async loadTeacherData(): Promise<void> {
    try {
      // TODO: Get teacher ID from auth service
      this.currentTeacherId = 'current-teacher-id';
      
      // Load classes and subjects using firstValueFrom for better async/await support
      const [classes, subjects] = await Promise.all([
        firstValueFrom(this.reportService.getDepartmentClasses(this.currentTeacherId)),
        firstValueFrom(this.reportService.getTeacherSubjects(this.currentTeacherId))
      ]);

      this.classes = classes || [];
      this.subjects = subjects || [];
    } catch (error) {
      console.error('Error loading teacher data:', error);
      alert('Failed to load teacher data. Please refresh the page.');
    }
  }

  onReportTypeChange(): void {
    // Reset dates when report type changes
    this.selectedDate = '';
    this.selectedWeek = '';
    this.selectedMonth = '';
    this.customStartDate = '';
    this.customEndDate = '';
    this.reportData = [];
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  async generateReport(): Promise<void> {
    if (!this.selectedClass) {
      alert('Please select a class');
      return;
    }

    if (this.reportType === 'subject-wise' && !this.selectedSubject) {
      alert('Please select a subject');
      return;
    }

    this.isGenerating = true;
    try {
      // Prepare parameters for the report
      const params: any = {
        classId: this.selectedClass,
        reportType: this.reportType,
      };

      // Add parameters based on report type
      switch (this.reportType) {
        case 'daily':
          params.date = this.selectedDate;
          break;
        case 'weekly':
          params.startDate = this.selectedWeek;
          params.endDate = new Date(new Date(this.selectedWeek).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'monthly':
          const [year, month] = this.selectedMonth.split('-');
          params.startDate = `${year}-${month}-01`;
          params.endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
          break;
        case 'subject-wise':
          params.subjectId = this.selectedSubject;
          break;
        case 'custom':
          params.startDate = this.customStartDate;
          params.endDate = this.customEndDate;
          break;
      }

      // Get report from service
      const report = await this.reportService.getAttendanceReport(params).toPromise();
      if (report) {
        this.processReportData(report);
        this.initializeChart();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      this.isGenerating = false;
    }
  }

  private processReportData(report: AttendanceReport): void {
    // Set headers based on report type
    switch (this.reportType) {
      case 'daily':
        this.reportHeaders = ['Roll No', 'Student Name', 'Status', 'Time'];
        break;
      case 'weekly':
      case 'monthly':
      case 'custom':
        this.reportHeaders = ['Roll No', 'Student Name', 'Present Days', 'Absent Days', 'Attendance %'];
        break;
      case 'subject-wise':
        this.reportHeaders = ['Roll No', 'Student Name', 'Total Classes', 'Classes Attended', 'Attendance %'];
        break;
    }

    // Transform attendance data into report rows
    this.reportData = report.attendance_data.map((student) => {
      const { roll_number, name, present_classes, absent_classes, attendance_percentage } = student;
      
      switch (this.reportType) {
        case 'daily':
          return [
            roll_number,
            name,
            present_classes === 1 ? 'Present' : 'Absent',
            present_classes === 1 ? '9:00 AM' : '-'
          ];
        default:
          return [
            roll_number,
            name,
            present_classes.toString(),
            absent_classes.toString(),
            `${attendance_percentage}%`
          ];
      }
    });
  }

  private initializeChart(): void {
    const canvas = document.getElementById('attendanceChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare chart data based on report type
    const labels = this.reportData.map(row => row[1]); // Student names
    const data = this.reportData.map(row => parseFloat(row[row.length - 1])); // Attendance percentage

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Attendance Percentage',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Attendance Overview'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Attendance %'
            }
          }
        }
      }
    });
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const title = `Attendance Report - ${this.reportType.toUpperCase()}`;
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add report details
    doc.setFontSize(10);
    const selectedClass = this.classes.find(c => c.id === this.selectedClass);
    doc.text(`Class: ${selectedClass?.name || this.selectedClass}`, 14, 25);
    
    if (this.selectedSubject) {
      const selectedSubject = this.subjects.find(s => s.subject.id === this.selectedSubject);
      doc.text(`Subject: ${selectedSubject?.subject.name || ''}`, 14, 30);
    }
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, this.selectedSubject ? 35 : 30);

    // Add table
    autoTable(doc, {
      head: [this.reportHeaders],
      body: this.reportData,
      startY: this.selectedSubject ? 40 : 35,
    });

    // Get last auto table position
    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Add chart if it exists
    if (this.chart) {
      // Convert chart to image
      const canvas = document.getElementById('attendanceChart') as HTMLCanvasElement;
      const chartImage = canvas.toDataURL('image/png');
      
      // Add new page if there's not enough space
      if (finalY > 180) {
        doc.addPage();
        doc.text('Attendance Overview Chart', 14, 15);
        doc.addImage(chartImage, 'PNG', 10, 25, 190, 100);
      } else {
        doc.text('Attendance Overview Chart', 14, finalY + 10);
        doc.addImage(chartImage, 'PNG', 10, finalY + 20, 190, 100);
      }
    }

    // Save the PDF
    doc.save(`attendance-report-${this.reportType}-${new Date().getTime()}.pdf`);
  }

  exportToCSV(): void {
    // Format percentage values
    const formattedReportData = this.reportData.map(row => {
      return row.map((cell, index) => {
        // If this is a percentage column (last column)
        if (index === row.length - 1 && typeof cell === 'string' && cell.includes('%')) {
          return cell.replace('%', ''); // Remove % symbol for better numeric sorting
        }
        return cell;
      });
    });

    const selectedClass = this.classes.find(c => c.id === this.selectedClass);
    const selectedSubject = this.subjects.find(s => s.subject.id === this.selectedSubject);

    // Prepare metadata section
    const metadata = [
      ['Attendance Report Details'],
      [''],
      [`Report Type,${this.reportType.toUpperCase()}`],
      [`Class,${selectedClass?.name || this.selectedClass}`],
      [`Date Generated,${new Date().toLocaleString()}`],
      selectedSubject ? [`Subject,${selectedSubject.subject.name}`] : [],
      [''] // Empty row for spacing
    ];

    // Main report data section with proper column alignment
    const reportSection = [
      ['Main Report Data'],
      [''],
      this.reportHeaders,
      ...formattedReportData
    ];

    // Chart data section with percentage calculations
    const chartData = [
      [''],
      ['Attendance Overview Chart Data'],
      [''],
      ['Student Name', 'Present', 'Absent', 'Attendance Rate (%)'],
      ...this.reportData.map(row => {
        const presentDays = this.reportType === 'daily' ? 
          (row[2] === 'Present' ? 1 : 0) : 
          parseInt(row[2]);
        const absentDays = this.reportType === 'daily' ? 
          (row[2] === 'Absent' ? 1 : 0) : 
          parseInt(row[3]);
        const percentage = this.reportType === 'daily' ? 
          (presentDays * 100) : 
          parseFloat(row[4].replace('%', ''));

        return [
          row[1],
          presentDays.toString(),
          absentDays.toString(),
          percentage.toFixed(1)
        ];
      })
    ];

    // Summary statistics
    const summaryStats = [
      [''],
      ['Summary Statistics'],
      [''],
      ['Metric', 'Value'],
      ['Class Average (%)', (this.reportData.reduce((acc, row) => acc + parseFloat(row[row.length - 1].replace('%', '')), 0) / this.reportData.length).toFixed(1)],
      ['Total Students', this.reportData.length.toString()],
      ['Perfect Attendance Count', this.reportData.filter(row => row[row.length - 1] === '100%').length.toString()]
    ];

    // Combine all sections
    const csvData = [
      ...metadata,
      ...reportSection,
      ...chartData,
      ...summaryStats
    ];

    // Configure Papa Parse options for better formatting
    const csv = Papa.unparse(csvData, {
      delimiter: ',',
      header: false,
      newline: '\r\n',
      skipEmptyLines: false
    });

    // Create and download the file
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
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
