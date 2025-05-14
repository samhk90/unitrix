import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-tdashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tdashboard.component.html',
  styleUrls: ['./tdashboard.component.css']
})
export class TdashboardComponent implements OnInit {
  currentDate = new Date();
  isDarkMode: boolean = false;
  currentTeacher: any;
  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    // Subscribe to teacher profile changes
  }

  toggleTheme(value: boolean) {
    this.isDarkMode = value;
    // Add any theme-switching logic here
    document.documentElement.classList.toggle('dark', value);
  }
}
