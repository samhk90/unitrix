import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Document {
  id: string;
  name: string;
  url: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  status: 'Draft' | 'Published';
  publishDate: string;
  documents: Document[];
}

@Component({
  selector: 'app-notices',
  templateUrl: './notices.component.html',
  styleUrls: ['./notices.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NoticesComponent implements OnInit {
  notices: Notice[] = [];
  showModal = false;
  searchQuery = '';
  selectedCategory = 'all';
  selectedPriority = 'all';

  categories = ['Event','Notice'];

  newNotice: Notice = {
    id: '',
    title: '',
    content: '',
    category: 'Academic',
    priority: 'Medium',
    status: 'Draft',
    publishDate: new Date().toISOString(),
    documents: []
  };

  constructor() {}

  ngOnInit() {
    // In a real app, you would fetch notices from a service
    this.loadNotices();
  }

  openModal() {
    this.showModal = true;
    this.resetNewNotice();
  }

  closeModal() {
    this.showModal = false;
    this.resetNewNotice();
  }

  resetNewNotice() {
    this.newNotice = {
      id: '',
      title: '',
      content: '',
      category: 'Academic',
      priority: 'Medium',
      status: 'Draft',
      publishDate: new Date().toISOString(),
      documents: []
    };
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        // In a real app, you would upload the file to a server and get back a URL
        const doc: Document = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: URL.createObjectURL(file)
        };
        this.newNotice.documents.push(doc);
      });
    }
  }

  removeDocument(docId: string) {
    this.newNotice.documents = this.newNotice.documents.filter(doc => doc.id !== docId);
  }

  saveNotice() {
    if (this.newNotice.id) {
      // Update existing notice
      const index = this.notices.findIndex(n => n.id === this.newNotice.id);
      if (index !== -1) {
        this.notices[index] = { ...this.newNotice };
      }
    } else {
      // Create new notice
      const notice = {
        ...this.newNotice,
        id: Math.random().toString(36).substr(2, 9)
      };
      this.notices.unshift(notice);
    }
    this.closeModal();
  }

  publishNotice(notice: Notice) {
    const index = this.notices.findIndex(n => n.id === notice.id);
    if (index !== -1) {
      this.notices[index] = {
        ...notice,
        status: 'Published',
        publishDate: new Date().toISOString()
      };
    }
  }

  deleteNotice(noticeId: string) {
    this.notices = this.notices.filter(notice => notice.id !== noticeId);
  }

  private loadNotices() {
    // Mock data - in a real app, this would come from a service
    this.notices = [
      {
        id: '1',
        title: 'End of Semester Examination Schedule',
        content: 'The end of semester examinations will begin from June 1st, 2025...',
        category: 'Examination',
        priority: 'High',
        status: 'Published',
        publishDate: '2025-05-15',
        documents: [
          {
            id: 'doc1',
            name: 'exam_schedule.pdf',
            url: '#'
          }
        ]
      },
      {
        id: '2',
        title: 'Annual Sports Day',
        content: 'Annual Sports Day will be held on May 20th, 2025...',
        category: 'Event',
        priority: 'Medium',
        status: 'Published',
        publishDate: '2025-05-10',
        documents: []
      }
    ];
  }
}
