import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuEncuestaPage } from './menu-encuesta.page';

describe('MenuEncuestaPage', () => {
  let component: MenuEncuestaPage;
  let fixture: ComponentFixture<MenuEncuestaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuEncuestaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
