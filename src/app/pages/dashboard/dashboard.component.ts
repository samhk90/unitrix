import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  constructor(private authService: AuthService) { }
  currentDate = new Date();
  isDarkMode = false;
  teacher: any;
  ngOnInit() {
  };
  toggleTheme(isDark: boolean) {
    this.isDarkMode = isDark;
    document.documentElement.classList.toggle('dark', isDark);
  }
}
