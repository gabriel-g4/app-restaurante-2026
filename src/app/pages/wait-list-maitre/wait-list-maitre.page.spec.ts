import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitListMaitrePage } from './wait-list-maitre.page';

describe('WaitListMaitrePage', () => {
  let component: WaitListMaitrePage;
  let fixture: ComponentFixture<WaitListMaitrePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WaitListMaitrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
