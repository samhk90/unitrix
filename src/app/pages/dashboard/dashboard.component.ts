import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  currentDate = new Date();
  isDarkMode = false;

  toggleTheme(isDark: boolean) {
    this.isDarkMode = isDark;
    document.documentElement.classList.toggle('dark', isDark);
  }
}
