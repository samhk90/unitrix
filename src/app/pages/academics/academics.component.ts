import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface AcademicMenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './academics.component.html',
  styleUrl: './academics.component.css'
})
export class AcademicsComponent {
  isMenuCollapsed = false;
  activeRoute = '/academics/attendance';

  menuItems: AcademicMenuItem[] = [
    {
      label: 'Attendance',
      icon: 'users',
      route: '/academics/attendance'
    },
    {
      label: 'Time Table',
      icon: 'calendar',
      route: '/academics/timetable'
    },
    {
      label: 'Course Plan',
      icon: 'book',
      route: '/academics/course-plan'
    }
  ];

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  setActiveRoute(route: string) {
    this.activeRoute = route;
  }
}
