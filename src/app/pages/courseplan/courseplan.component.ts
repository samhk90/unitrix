import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Topic {
  name: string;
  startDate: string;
  endDate: string;
  progress?: number;
}

interface CoursePlan {
  id: string;
  subject: string;
  teacher: string;
  lastUpdated: Date;
  status: 'Draft' | 'Published' | 'In Progress';
  topics: Topic[];
}

@Component({
  selector: 'app-courseplan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courseplan.component.html',
  styleUrls: ['./courseplan.component.css']
})
export class CourseplanComponent implements OnInit {
  subjects: string[] = [
    'Computer Graphics',
    'Database Management',
    'Operating Systems',
    'Data Structures',
    'Software Engineering',
    'Web Development'
  ];
  
  selectedSubject: string = '';
  showModal: boolean = false;
  selectedPlan: CoursePlan | null = null;

  coursePlans: CoursePlan[] = [
    {
      id: '1',
      subject: 'Computer Graphics',
      teacher: 'N Zaman',
      lastUpdated: new Date(),
      status: 'In Progress',
      topics: [
        {
          name: 'Introduction to Computer Graphics',
          startDate: '2025-05-01',
          endDate: '2025-05-07',
          progress: 75
        },
        {
          name: '2D Graphics Fundamentals',
          startDate: '2025-05-08',
          endDate: '2025-05-14',
          progress: 50
        }
      ]
    },
    {
      id: '2',
      subject: 'Database Management',
      teacher: 'M Khan',
      lastUpdated: new Date(),
      status: 'Published',
      topics: [
        {
          name: 'Database Design',
          startDate: '2025-05-01',
          endDate: '2025-05-07',
          progress: 100
        }
      ]
    },
    {
      id: '3',
      subject: 'Operating Systems',
      teacher: 'P Shah',
      lastUpdated: new Date(),
      status: 'Draft',
      topics: [
        {
          name: 'Process Management',
          startDate: '2025-05-15',
          endDate: '2025-05-21',
          progress: 0
        }
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.sortCoursePlans();
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-3 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ';
    switch (status) {
      case 'Draft':
        return baseClasses + 'bg-gray-100 text-gray-800';
      case 'Published':
        return baseClasses + 'bg-green-100 text-green-800';
      case 'In Progress':
        return baseClasses + 'bg-blue-100 text-blue-800';
      default:
        return baseClasses + 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Draft':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'Published':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'In Progress':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return '';
    }
  }

  openEditModal(plan: CoursePlan): void {
    this.selectedPlan = JSON.parse(JSON.stringify(plan));
    this.showModal = true;
  }

  closeModal(): void {
    // Add fade-out animation before closing
    const modal = document.querySelector('.animate-modalSlideIn') as HTMLElement;
    if (modal) {
      modal.style.animation = 'modalSlideIn 0.3s ease-out reverse';
      setTimeout(() => {
        this.showModal = false;
        this.selectedPlan = null;
      }, 250);
    } else {
      this.showModal = false;
      this.selectedPlan = null;
    }
  }

  addTopic(): void {
    if (this.selectedPlan) {
      this.selectedPlan.topics.push({
        name: '',
        startDate: '',
        endDate: '',
        progress: 0
      });
    }
  }

  removeTopic(index: number): void {
    if (this.selectedPlan) {
      // Add fade-out animation before removing
      const row = document.querySelectorAll('tbody tr')[index] as HTMLElement;
      if (row) {
        row.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
          this.selectedPlan!.topics.splice(index, 1);
        }, 150);
      } else {
        this.selectedPlan.topics.splice(index, 1);
      }
    }
  }

  savePlan(): void {
    if (this.selectedPlan) {
      const index = this.coursePlans.findIndex(p => p.id === this.selectedPlan!.id);
      if (index !== -1) {
        this.selectedPlan.lastUpdated = new Date();
        this.coursePlans[index] = { ...this.selectedPlan };
        this.sortCoursePlans();
      }
      this.closeModal();
    }
  }

  private sortCoursePlans(): void {
    this.coursePlans.sort((a, b) => {
      if (a.status === b.status) {
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }
      return this.getStatusPriority(a.status) - this.getStatusPriority(b.status);
    });
  }

  private getStatusPriority(status: string): number {
    switch (status) {
      case 'In Progress': return 1;
      case 'Published': return 2;
      case 'Draft': return 3;
      default: return 4;
    }
  }
}
