import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdashboardComponent } from './tdashboard.component';

describe('TdashboardComponent', () => {
  let component: TdashboardComponent;
  let fixture: ComponentFixture<TdashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
