import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as Papa from 'papaparse';

Chart.register(...registerables);

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, AfterViewInit {
  // Form selections
  selectedClass: string = '';
  selectedSubject: string = '';
  reportType: 'daily' | 'weekly' | 'monthly' | 'subject-wise' | 'custom' = 'daily';
  selectedDate: string = '';
  selectedWeek: string = '';
  selectedMonth: string = '';
  customStartDate: string = '';
  customEndDate: string = '';

  // Sample data (replace with actual data from your service)
  classes: Class[] = [
    { id: 'SE_Computer', name: 'SE Computer' },
    { id: 'TE_Computer', name: 'TE Computer' },
    { id: 'BE_Computer', name: 'BE Computer' }
  ];

  subjects: Subject[] = [
    { id: 'CG', name: 'Computer Graphics' },
    { id: 'DBMS', name: 'Database Management' },
    { id: 'OS', name: 'Operating Systems' }
  ];

  // Report data
  reportHeaders: string[] = [];
  reportData: any[][] = [];
  chart: Chart | null = null;

  constructor() {}

  ngOnInit(): void {
    // Initialize with today's date
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  ngAfterViewInit(): void {
    // Initialize chart if report data exists
    if (this.reportData.length > 0) {
      this.initializeChart();
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

  async generateReport(format: 'pdf' | 'csv'): Promise<void> {
    // Validate inputs
    if (!this.selectedClass) {
      alert('Please select a class');
      return;
    }

    if (this.reportType === 'subject-wise' && !this.selectedSubject) {
      alert('Please select a subject');
      return;
    }

    // Generate sample report data based on report type
    this.generateReportData();

    // Initialize or update chart
    this.initializeChart();

    // Export report in selected format
    if (format === 'pdf') {
      this.exportToPDF();
    } else {
      this.exportToCSV();
    }
  }

  private generateReportData(): void {
    // Sample data generation based on report type
    switch (this.reportType) {
      case 'daily':
        this.reportHeaders = ['Roll No', 'Student Name', 'Status', 'Time'];
        this.reportData = [
          ['1', 'John Doe', 'Present', '9:00 AM'],
          ['2', 'Jane Smith', 'Absent', '-'],
          ['3', 'Mike Johnson', 'Present', '9:05 AM']
        ];
        break;

      case 'weekly':
      case 'monthly':
        this.reportHeaders = ['Roll No', 'Student Name', 'Present Days', 'Absent Days', 'Attendance %'];
        this.reportData = [
          ['1', 'John Doe', '4', '1', '80%'],
          ['2', 'Jane Smith', '3', '2', '60%'],
          ['3', 'Mike Johnson', '5', '0', '100%']
        ];
        break;

      case 'subject-wise':
        this.reportHeaders = ['Roll No', 'Student Name', 'Total Classes', 'Classes Attended', 'Attendance %'];
        this.reportData = [
          ['1', 'John Doe', '20', '18', '90%'],
          ['2', 'Jane Smith', '20', '15', '75%'],
          ['3', 'Mike Johnson', '20', '19', '95%']
        ];
        break;

      case 'custom':
        this.reportHeaders = ['Roll No', 'Student Name', 'Present Days', 'Absent Days', 'Attendance %'];
        this.reportData = [
          ['1', 'John Doe', '8', '2', '80%'],
          ['2', 'Jane Smith', '6', '4', '60%'],
          ['3', 'Mike Johnson', '10', '0', '100%']
        ];
        break;
    }
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

  private exportToPDF(): void {
    const doc = new jsPDF();
    const title = `Attendance Report - ${this.reportType.toUpperCase()}`;
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add report details
    doc.setFontSize(10);
    doc.text(`Class: ${this.selectedClass}`, 14, 25);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Add table
    autoTable(doc, {
      head: [this.reportHeaders],
      body: this.reportData,
      startY: 35,
    });

    // Save the PDF
    doc.save(`attendance-report-${this.reportType}-${new Date().getTime()}.pdf`);
  }

  private exportToCSV(): void {
    const csvData = [
      this.reportHeaders,
      ...this.reportData
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-report-${this.reportType}-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
