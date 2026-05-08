import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersCocineroPage } from './orders-cocinero.page';

describe('OrdersCocineroPage', () => {
  let component: OrdersCocineroPage;
  let fixture: ComponentFixture<OrdersCocineroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersCocineroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
