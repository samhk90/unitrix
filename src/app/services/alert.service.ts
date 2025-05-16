import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  autoClose?: boolean;
  keepAfterRouteChange?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private subject = new BehaviorSubject<Alert[]>([]);
  private defaultId = 'default-alert';

  alerts$: Observable<Alert[]> = this.subject.asObservable();

  success(message: string, options?: any) {
    this.alert({ ...options, type: 'success', message });
  }

  error(message: string, options?: any) {
    this.alert({ ...options, type: 'error', message });
  }

  info(message: string, options?: any) {
    this.alert({ ...options, type: 'info', message });
  }

  warn(message: string, options?: any) {
    this.alert({ ...options, type: 'warning', message });
  }

  alert(alert: Partial<Alert>) {
    alert.id = alert.id || this.defaultId;
    const alerts = this.subject.value;
    const existingAlert = alerts.find(x => x.id === alert.id);
    
    if (existingAlert) {
      // remove existing alert
      alerts.splice(alerts.indexOf(existingAlert), 1);
    }
    
    // add new alert to array
    const newAlert: Alert = {
      ...alert,
      id: alert.id || this.defaultId,
      type: alert.type || 'info',
      message: alert.message || '',
      autoClose: alert.autoClose !== undefined ? alert.autoClose : true
    } as Alert;
    
    this.subject.next([...alerts, newAlert]);

    // auto close alert if required
    if (newAlert.autoClose) {
      setTimeout(() => this.removeAlert(newAlert), 5000);
    }
  }

  clear(id = this.defaultId) {
    const alerts = this.subject.value;
    this.subject.next(alerts.filter(x => x.id !== id));
  }

  removeAlert(alert: Alert) {
    const alerts = this.subject.value;
    if (!alert) return;
    
    // remove specified alert
    this.subject.next(alerts.filter(x => x !== alert));
  }
}