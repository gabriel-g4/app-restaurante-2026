import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewBeveragePage } from './new-beverage.page';

describe('NewBeveragePage', () => {
  let component: NewBeveragePage;
  let fixture: ComponentFixture<NewBeveragePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NewBeveragePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
