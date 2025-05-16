import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.config';
import { AuthService } from './auth.service';

export interface Role {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  teacher_id?: string;
}

export interface Class {
  id: string;
  name: string;
  department_id: string;
}

export interface Batch {
  id: string;
  name: string;
  class_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  constructor() { }

  async getRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('erp_1_roles')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  async getDepartmentsByTeacher(teacherId: string): Promise<Department[]> {
    try {
      const { data, error } = await supabase
        .from('erp_1_teacher')
        .select('*')
        .eq('Teacherid', teacherId);

      if (error) throw error;
      return data[0]?.DepartmentID_id ? [data[0].DepartmentID_id] : [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getClassesByDepartment(departmentId: string): Promise<Class[]> {
    try {
        
      const { data, error } = await supabase
        .from('erp_1_classes')
        .select('*')
        .eq('DepartmentID_id', departmentId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  }

  async getBatchesByClass(classId: string): Promise<Batch[]> {
    try {
      const { data, error } = await supabase
        .from('erp_1_batches')
        .select('*')
        .eq('ClassID_id', classId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  // Helper method to get all data for a teacher in one call
  async getAllTeacherData(teacherId: string): Promise<{
    departments: Department[];
    classes: Class[];
    batches: Batch[];
  }> {
    try {
      // First get departments
      const departments = await this.getDepartmentsByTeacher(teacherId);
      
      // Then get classes for each department
      const classPromises = departments.map(dept => this.getClassesByDepartment(dept.id));
      const classesArrays = await Promise.all(classPromises);
      const classes = classesArrays.flat();

      // Finally get batches for each class
      const batchPromises = classes.map(cls => this.getBatchesByClass(cls.id));
      const batchesArrays = await Promise.all(batchPromises);
      const batches = batchesArrays.flat();

      return {
        departments,
        classes,
        batches
      };
    } catch (error) {
      console.error('Error fetching all teacher data:', error);
      throw error;
    }
  }
}