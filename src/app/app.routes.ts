import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { TimetableComponent } from './pages/timetable/timetable.component';
import { CourseplanComponent } from './pages/courseplan/courseplan.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { NoticesComponent } from './pages/notices/notices.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'academics', children: [
        { path: 'attendance', component: AttendanceComponent },
        { path: 'timetable', component: TimetableComponent },
        { path: 'courseplan', component: CourseplanComponent }
      ]},
      { path: 'reports', component: ReportsComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'notices', component: NoticesComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
