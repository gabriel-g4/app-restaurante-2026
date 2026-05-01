import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionarClientesPage } from './gestionar-clientes.page';

describe('GestionarClientesPage', () => {
  let component: GestionarClientesPage;
  let fixture: ComponentFixture<GestionarClientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionarClientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
