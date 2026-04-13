import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { addIcons } from 'ionicons';
import { power } from 'ionicons/icons';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon],
})
export class HomePage implements OnInit, OnDestroy {
  constructor(private router: Router, private authService: AuthService, private databaseService: DatabaseService) {
    addIcons({power})
  }

  userData: any;
  usuario!: Subscription;

  async ngOnInit() {
    this.usuario = this.authService.usuario$.subscribe(usuario => {
      console.log(usuario);
      this.cargarUsuario(usuario);
    });
  }

  ngOnDestroy() {
    this.usuario.unsubscribe();
  }



  async cargarUsuario(usuario: any) {
    if (usuario) {
      this.userData = await this.databaseService.obtenerUsuarioPorId(usuario.uid);
    } else {
      this.userData = null;
      this.router.navigate(['/login']);
    }
  }

  enviarALogin() {
    this.router.navigate(['/login'])
  }

  cerrarSesion() {
    this.userData = null;
    return this.authService.cerrarSesion();
  }

}
