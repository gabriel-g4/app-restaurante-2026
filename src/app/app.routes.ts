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
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'new-employee',
    loadComponent: () => import('./pages/new-employee/new-employee.page').then(m => m.NewEmployeePage)
  },
  {
    path: 'new-dish',
    loadComponent: () => import('./pages/new-dish/new-dish.page').then(m => m.NewDishPage)
  },
  {
    path: 'new-table',
    loadComponent: () => import('./pages/new-table/new-table.page').then(m => m.NewTablePage)
  },
  {
    path: 'gestionar-clientes',
    loadComponent: () => import('./pages/gestionar-clientes/gestionar-clientes.page').then(m => m.GestionarClientesPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage)
  },
  {
    path: 'new-beverage',
    loadComponent: () => import('./pages/new-beverage/new-beverage.page').then(m => m.NewBeveragePage)
  },
  {
    path: 'juegos',
    loadComponent: () => import('./pages/juegos/juegos.page').then(m => m.JuegosPage)
  },
  {
    path: 'wait-list',
    loadComponent: () => import('./pages/wait-list/wait-list.page').then(m => m.WaitListPage)
  },
  {
    path: 'wait-list-maitre',
    loadComponent: () => import('./pages/wait-list-maitre/wait-list-maitre.page').then( m => m.WaitListMaitrePage)
  },
  {
    path: 'pedidos-mozo',
    loadComponent: () => import('./pages/pedidos-mozo/pedidos-mozo.page').then( m => m.PedidosMozoPage)
  },
  {
    path: 'orders-cocinero',
    loadComponent: () => import('./pages/orders-cocinero/orders-cocinero.page').then( m => m.OrdersCocineroPage)
  },
  {
    path: 'pedidos-mozo',
    loadComponent: () => import('./pages/pedidos-mozo/pedidos-mozo.page').then( m => m.PedidosMozoPage)
  },
  {
    path: 'informacion-mesa/:idMesa',
    loadComponent: () => import('./pages/informacion-mesa/informacion-mesa.page').then( m => m.InformacionMesaPage)
  },
  {
    path: '**',
    redirectTo: 'home',
  },





];
