import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
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
    path: 'new-dish',
    loadComponent: () => import('./pages/new-dish/new-dish.page').then( m => m.NewDishPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },


  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: '**',
    redirectTo: 'home',
  }

  
];
