import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notice, NoticesService } from '../../services/notices.service';
import { AlertService } from '../../services/alert.service';
import { ReportService, DepartmentClass } from '../../services/report.service';

@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notices.component.html',
  styleUrls: ['./notices.component.css']
})
export class NoticesComponent implements OnInit {
  notices: Notice[] = [];
  selectedCategory = 'all';
  searchQuery = '';
  showModal = false;
  isUploading = false;
  isLoading = false;
  departmentClasses: DepartmentClass[] = [];

  newNotice: Partial<Notice> = {
    title: '',
    content: '',
    documents: [],
    class_id: '',
    department: '',
    class_department: ''
  };

  constructor(
    private noticesService: NoticesService,
    private alertService: AlertService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadNotices();
    this.loadClasses();
  }

  private loadClasses() {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    const teacherId = teacher?.teacher_id;
    
    if (!teacherId) {
      this.alertService.error('Teacher ID not found. Please login again.');
      return;
    }

    this.reportService.getDepartmentClasses(teacherId).subscribe({
      next: (response) => {
        this.departmentClasses = response.data;
      },
      error: (error) => {
        this.alertService.error('Failed to load classes');
        console.error('Error loading classes:', error);
      }
    });
  }

  loadNotices() {
    const params: any = {};

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    const teacherId = teacher?.teacher_id;
    
    if (!teacherId) {
      this.alertService.error('Teacher ID not found. Please login again.');
      return;
    }
    
    params.teacher_id = teacherId;
    this.isLoading = true;

    this.noticesService.getNotices(params).subscribe({
      next: (response) => {
        this.notices = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.alertService.error('Failed to load notices');
        console.error('Error loading notices:', error);
        this.isLoading = false;
      }
    });
  }

  openModal() {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    this.newNotice = {
      title: '',
      content: '',
      documents: [],
      class_id: '',
      department: teacher?.department || '',
      class_department: teacher?.department || ''
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async handleFileUpload(event: any) {
    const files: FileList = event.target.files;
    if (files.length === 0) return;

    this.isUploading = true;
    try {
      for (let i = 0; i < files.length; i++) {
        const document = await this.noticesService.uploadDocument(files[i], this.newNotice.class_id);
        this.newNotice.documents = [...(this.newNotice.documents || []), document];
      }
      this.alertService.success('Documents uploaded successfully');
    } catch (error) {
      this.alertService.error('Failed to upload documents');
      console.error('Error uploading documents:', error);
    } finally {
      this.isUploading = false;
    }
  }

  async removeDocument(docId: number) {
    const document = this.newNotice.documents?.find(d => d.id === docId);
    if (!document) return;

    try {
      await this.noticesService.deleteDocument(document.path);
      this.newNotice.documents = this.newNotice.documents?.filter(d => d.id !== docId);
      this.alertService.success('Document removed successfully');
    } catch (error) {
      this.alertService.error('Failed to remove document');
      console.error('Error removing document:', error);
    }
  }

  saveNotice() {
    this.noticesService.createNotice(this.newNotice).subscribe({
      next: (response) => {
        this.alertService.success('Notice created successfully');
        this.loadNotices();
        this.closeModal();
      },
      error: (error) => {
        this.alertService.error('Failed to create notice');
        console.error('Error creating notice:', error);
      }
    });
  }

  publishNotice(notice: Notice) {
    this.noticesService.publishNotice(notice.id).subscribe({
      next: (response) => {
        this.alertService.success('Notice published successfully');
        this.loadNotices();
        console.log('Notice published:', notice);
      },
      error: (error) => {
        this.alertService.error('Failed to publish notice');
        console.error('Error publishing notice:', error);
      }
    });
  }

  deleteNotice(id: number) {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    this.noticesService.deleteNotice(id).subscribe({
      next: (response) => {
        const docId = this.notices.find(notice => notice.id === id)?.documents[0].id;
        this.removeDocument(docId|| 0);
        this.alertService.success('Notice deleted successfully');
        this.loadNotices();
      },
      error: (error) => {
        this.alertService.error('Failed to delete notice');
        console.error('Error deleting notice:', error);
      }
    });
  }
}
