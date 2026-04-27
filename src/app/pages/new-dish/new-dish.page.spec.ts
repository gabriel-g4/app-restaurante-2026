import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewDishPage } from './new-dish.page';

describe('NewDishPage', () => {
  let component: NewDishPage;
  let fixture: ComponentFixture<NewDishPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NewDishPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
