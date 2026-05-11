import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InformacionMesaPage } from './informacion-mesa.page';

describe('InformacionMesaPage', () => {
  let component: InformacionMesaPage;
  let fixture: ComponentFixture<InformacionMesaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InformacionMesaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
