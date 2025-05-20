import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { supabase } from '../config/supabase.config';

export interface Notice {
  id: number;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishDate: string;
  created_by: string;
  documents: Document[];
  teacher_id?: string;
  class_id: string;
  class_name?: string;
  department?: string;
  class_department?: string;
}

export interface Document {
  id: number;
  name: string;
  path: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NoticesService {
  private apiUrl = `http://127.0.0.1:8000/api/notices/`;
  private BUCKET_NAME = 'noticebucket';

  constructor(private http: HttpClient) {
    this.initSupabaseBucket();
  }

  private async initSupabaseBucket() {
    const { data: bucketExists } = await supabase.storage.getBucket(this.BUCKET_NAME);
    if (!bucketExists) {
      await supabase.storage.createBucket(this.BUCKET_NAME, { public: true });
    }
  }

  // Get all notices with optional filters
  getNotices(params?: { category?: string; search?: string; teacher_id?: string }): Observable<{ message: string; data: Notice[] }> {
    return this.http.get<{ message: string; data: Notice[] }>(this.apiUrl, { params });
  }

  // Create a new notice
  createNotice(notice: Partial<Notice>): Observable<{ message: string; data: Notice }> {
    const teacher = JSON.parse(localStorage.getItem('teacher') || '{}');
    const teacher_id = teacher?.teacher_id;

    if (!teacher_id) {
      throw new Error('Teacher ID not found. Please login again.');
    }

    // Map document URLs and add teacher_id
    const noticeData = {
      ...notice,
      teacher_id,
      documents: notice.documents?.map(doc => ({
        name: doc.name,
        path: doc.path,
        url: doc.url
      }))
    };
    
    return this.http.post<{ message: string; data: Notice }>(this.apiUrl, noticeData);
  }

  // Delete a notice
  deleteNotice(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${id}/delete/`);
  }

  // Publish a notice
  publishNotice(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}${id}/publish/`, {});
  }

  // Upload document to Supabase storage
  async uploadDocument(file: File, class_id?: string): Promise<Document> {
    const timestamp = new Date().getTime();
    const filePath = `${class_id ? `${class_id}/` : ''}${file.name}`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(`public/${filePath}`, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(`public/${filePath}`);

    return {
      id: timestamp,
      name: file.name,
      path: filePath,
      url: publicUrl
    };
  }

  // Delete document from Supabase storage
  async deleteDocument(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([`public/${filePath}`]);

    if (error) {
      throw error;
    }
  }
}