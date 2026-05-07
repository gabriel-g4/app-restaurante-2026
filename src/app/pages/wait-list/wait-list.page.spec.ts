import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitListPage } from './wait-list.page';

describe('WaitListPage', () => {
  let component: WaitListPage;
  let fixture: ComponentFixture<WaitListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WaitListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
