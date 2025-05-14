import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Check if there's a remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
    }
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        const { email, password, rememberMe } = this.loginForm.value;
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        await this.authService.signIn(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to login. Please try again.';
      } finally {
        this.isLoading = false;
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async forgotPassword() {
    const email = this.loginForm.get('email')?.value;
    if (!email || !this.loginForm.get('email')?.valid) {
      this.errorMessage = 'Please enter a valid email address first';
      return;
    }

    try {
      await this.authService.resetPassword(email);
      alert('Password reset instructions have been sent to your email');
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to send reset instructions';
    }
  }
}
