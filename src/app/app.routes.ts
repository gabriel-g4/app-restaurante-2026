import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'new-employee',
    loadComponent: () => import('./pages/new-employee/new-employee.page').then( m => m.NewEmployeePage)
  },


  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
