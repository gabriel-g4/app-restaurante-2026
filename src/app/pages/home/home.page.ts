import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonFooter, IonContent, IonIcon, IonSpinner, Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { addIcons } from 'ionicons';
import { power } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { HomeAdminComponent } from './components/home-admin/home-admin.component';
import { HomeCocineroComponent } from './components/home-cocinero/home-cocinero.component';
import { HomeMozoComponent } from "./components/home-mozo/home-mozo.component";
import { HomeClienteComponent } from './components/home-cliente/home-cliente.component';
import { HomeBartenderComponent } from "./components/home-bartender/home-bartender.component";
import { HomeMaitreComponent } from './components/home-maitre/home-maitre.component';
import { App } from '@capacitor/app';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    HomeAdminComponent, HomeCocineroComponent, HomeMozoComponent, HomeClienteComponent,
    IonFooter, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, HomeBartenderComponent, HomeMaitreComponent,
    IonSpinner
  ]
})
export class HomePage implements OnInit, OnDestroy {
  userData: any = null;
  rolUsuario: string = '';
  usuario!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private platform: Platform
  ) {
    addIcons({ power });
    this.platform.backButton.subscribeWithPriority(10, async (processNextHandler) => {
      if (this.router.url === '/home') {
        const audio = new Audio('/assets/sounds/logout.mp3');
        try {
          await audio.play();
        } catch (e) {
          console.error('Error audio:', e);
        }
        // Pequeña demora para escuchar el sonido antes de matar la app
        setTimeout(() => {
          App.exitApp();
        }, 800);
      } else {
        processNextHandler();
      }
    });
  }

  async ngOnInit() {
    // Nos suscribimos a los cambios de estado de Firebase Auth
    this.usuario = this.authService.usuario$.subscribe(usuarioAuth => {
      this.cargarUsuario(usuarioAuth);
    });
  }

  ngOnDestroy() {
    if (this.usuario) {
      this.usuario.unsubscribe();
    }
  }

  async cargarUsuario(usuarioAuth: any) {
    if (usuarioAuth) {
      let rolEnMemoria = this.authService.getRol();
      if (rolEnMemoria) {
        this.rolUsuario = rolEnMemoria;
      }

      if (usuarioAuth.email) {
        this.userData = await this.databaseService.obtenerUsuarioPorEmail(usuarioAuth.email);

        if (this.userData && this.userData.rol) {
          this.rolUsuario = this.userData.rol;
          this.authService.setRol(this.rolUsuario);
        }
      }

    } else {
      this.userData = null;
      this.rolUsuario = '';
      this.router.navigate(['/login']);
    }
  }

  enviarALogin() {
    this.router.navigate(['/login']);
  }

  cerrarSesion() {
    this.userData = null;
    this.rolUsuario = '';
    return this.authService.cerrarSesion();
  }
}