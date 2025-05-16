import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  submenu?: MenuItem[];
  isExpanded?: boolean;
}

interface UserProfile {
  name: string;
  role: string;
  department: string;
  photoUrl: string;
  isVerified: boolean;
  experience: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  activeRoute: string = '';
  isMobile: boolean = false;
  touchStartX: number = 0;

  userProfile: UserProfile = {
    name: 'Dr. Jane Smith',
    role: 'Professor',
    department: 'Computer Science',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    isVerified: true,
    experience: '10+ Years'
  };

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'chart-pie'
    },
  
    {
      label: 'Academics',
      icon: 'graduation-cap',
      submenu: [
        {
          label: 'Attendance',
          route: '/academics/attendance',
          icon: 'book'
        },
        {
          label: 'Timetable',
          route: '/academics/timetable',
          icon: 'tasks'
        },
        {
          label: 'Course Plan',
          route: '/academics/courseplan',
          icon: 'star'
        }
      ],
      isExpanded: false
    },
    {
      label: 'Calendar',
      route: '/calendar',
      icon: 'calendar-alt'
    },
    {
      label: 'Messages',
      route: '/messages',
      icon: 'comments'
    },
    {
      label: 'Settings',
      route: '/settings',
      icon: 'cog'
    }
  ];

  constructor(private router: Router, private authService: AuthService) {
    // Subscribe to router events to update active route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = event.url;
      this.updateSubmenuState();
    });
  }

  ngOnInit() {
    // Set initial active route
    this.activeRoute = this.router.url;
    this.updateSubmenuState();
  }

  setActiveRoute(route: string) {
    this.activeRoute = route;
  }

  toggleSubmenu(item: MenuItem) {
    if (!this.isCollapsed) {
      item.isExpanded = !item.isExpanded;

      // Close other submenus
      this.menuItems.forEach(menuItem => {
        if (menuItem !== item && menuItem.submenu) {
          menuItem.isExpanded = false;
        }
      });
    }
  }

  updateSubmenuState() {
    this.menuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some(subItem =>
          this.activeRoute.startsWith(subItem.route || '')
        );
        item.isExpanded = hasActiveChild;
      }
    });
  }

  // Touch events for mobile swipe functionality
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    const touchEndX = event.touches[0].clientX;
    const deltaX = touchEndX - this.touchStartX;

    // Threshold for swipe gesture (50px)
    if (Math.abs(deltaX) > 50) {
      this.isCollapsed = deltaX < 0;
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  closeAllSubmenus() {
    // Close all submenus when clicking on a regular menu item
    this.menuItems.forEach(menuItem => {
      if (menuItem.submenu) {
        menuItem.isExpanded = false;
      }
    });
  }

  logout() {
    // Implement logout logic here
    this.authService.signOut()
  }
}
