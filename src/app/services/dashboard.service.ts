import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

export interface Teacher {
  Teacherid: string;
  FirstName: string;
  LastName: string;
  Email: string;
  ContactNumber: string;
  DepartmentID_id: number;
  RoleID_id: number;
  profile_image?: string;
  Department?: any;
  Role?: any;
}

export interface DashboardStats {
  totalSubjects: number;
  todayClasses: number;
  completedClasses: number;
  attendanceRate: number;
  activeTasks: number;
  leaveBalance: {
    total: number;
    taken: number;
    remaining: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  async fetchTeacher(teacherId: string): Promise<Teacher | null> {
    try {
      const { data: teacher, error } = await this.supabase
        .from('erp_1_teacher')
        .select('*')
        .eq('Teacherid', teacherId)
        .single();


      if (error) throw error;

      if (teacher) {
        // Get department details
        const { data: department, error: departmentError } = await this.supabase
          .from('erp_1_department')
          .select('*')
          .eq('DepartmentID', teacher.DepartmentID_id)
          .single();

        // Get role details
        const { data: role, error: roleError } = await this.supabase
          .from('erp_1_roles')
          .select('*')
          .eq('RoleID', teacher.RoleID_id)
          .single();

        if (departmentError || roleError) throw departmentError || roleError;

        return {
          ...teacher,
          Department: department,
          Role: role
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching teacher:', error);
      return null;
    }
  }

  async fetchTodaySchedule(): Promise<any[]> {
    try {
      const today = new Date();
      const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' }); // Returns "Monday", "Tuesday", etc.
      const teacherId = sessionStorage.getItem('Teacherid');

      if (!teacherId) {
        throw new Error('No teacher ID found in session');
      }

      // First check temp timetable for any special schedules
      const { data: tempData, error: tempError } = await this.supabase
        .from('erp_1_temptimetable')
        .select(`
          *,
          class:erp_1_classes!erp_1_temptimetable_ClassID_id_fkey(ClassID, ClassName),
          subject:erp_1_subject!erp_1_temptimetable_SubjectID_id_fkey(SubjectID, SubjectName),
          slot:erp_1_slots!erp_1_temptimetable_SlotID_id_fkey(Slotid, StartTime, EndTime),
          batch:erp_1_batch!erp_1_temptimetable_Batch_id_fkey(Batchid, BatchName)
        `)
        .eq('TeacherID_id', teacherId)
        .eq('Date', today.toISOString().split('T')[0]);

      if (tempError) throw tempError;

      // If no temporary schedule, get regular schedule
      if (!tempData || tempData.length === 0) {
        const { data: regularData, error: regularError } = await this.supabase
          .from('erp_1_timetable')
          .select(`
            *,
            class:erp_1_classes!erp_1_timetable_ClassID_id_fkey(ClassID, ClassName),
            subject_assignment:erp_1_teachersubjectassignment!erp_1_timetable_SubjectAssignmentID_id_fkey(
              AssignmentID,
              subject:erp_1_subject!erp_1_teacher_subjec_SubjectID_id_5a85b270_fk_erp_1_sub(SubjectID, SubjectName)
            ),
            slot:erp_1_slots!erp_1_timetable_SlotID_id_fkey(Slotid, StartTime, EndTime),
            batch:erp_1_batch!erp_1_timetable_Batch_id_fkey(Batchid, BatchName)
          `)
          .eq('Day', dayOfWeek)
          .eq('subject_assignment.TeacherID_id', teacherId);

        if (regularError) throw regularError;
        return regularData;
      }

      return tempData;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
  }

  async fetchDashboardStats(teacherId: string): Promise<DashboardStats> {
    // This would typically make API calls to get real stats
    // For now returning mock data
    return {
      totalSubjects: 4,
      todayClasses: 3,
      completedClasses: 1,
      attendanceRate: 95,
      activeTasks: 2,
      leaveBalance: {
        total: 20,
        taken: 5,
        remaining: 15
      }
    };
  }
}