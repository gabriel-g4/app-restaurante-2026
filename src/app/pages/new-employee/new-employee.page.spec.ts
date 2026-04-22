import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewEmployeePage } from './new-employee.page';

describe('NewEmployeePage', () => {
  let component: NewEmployeePage;
  let fixture: ComponentFixture<NewEmployeePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NewEmployeePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
