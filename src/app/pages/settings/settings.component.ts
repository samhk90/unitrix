import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceComponent } from '../../component/attendance/attendance.component';
import { LeavesComponent } from '../../component/leaves/leaves.component';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface ProfileData {
  photoUrl: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
}

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, AttendanceComponent, LeavesComponent]
})
export class SettingsComponent {
  activeTab: string = 'profile';

  profileData: ProfileData = {
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    fullName: 'Dr. Jane Smith',
    email: 'jane.smith@eduverse.com',
    phone: '+1 (555) 123-4567',
    department: 'Computer Science',
    bio: 'Professor of Computer Science with 10+ years of teaching experience.'
  };

  securityData: SecurityData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  notificationSettings: NotificationSetting[] = [
    {
      id: '1',
      title: 'Email Notifications',
      description: 'Receive email notifications for important updates',
      enabled: true
    },
    {
      id: '2',
      title: 'Push Notifications',
      description: 'Get instant notifications on your browser',
      enabled: true
    },
    {
      id: '3',
      title: 'SMS Notifications',
      description: 'Receive text messages for urgent updates',
      enabled: false
    }
  ];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getTabClass(tab: string): string {
    const baseClasses = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200';
    if (this.activeTab === tab) {
      return `${baseClasses} bg-blue-50 text-blue-600`;
    }
    return `${baseClasses} text-gray-600 hover:bg-gray-50`;
  }

  updateProfile(): void {
    console.log('Updating profile...', this.profileData);
    // TODO: Implement profile update logic
  }

  updatePassword(): void {
    if (this.securityData.newPassword !== this.securityData.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    console.log('Updating password...');
    // TODO: Implement password update logic
    this.securityData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  toggleNotification(setting: NotificationSetting): void {
    setting.enabled = !setting.enabled;
    console.log('Toggled notification:', setting);
    // TODO: Implement notification toggle logic
  }

  setupTwoFactor(): void {
    console.log('Setting up 2FA...');
    // TODO: Implement 2FA setup logic
  }
}
