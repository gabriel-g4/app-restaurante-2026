import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonIcon, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gameControllerOutline, trophyOutline, starOutline, arrowBackOutline } from 'ionicons/icons';
import { BalanzaComponent } from 'src/app/pages/juegos/components/balanza/balanza.component';

@Component({
  selector: 'app-juegos',
  templateUrl: './juegos.page.html',
  styleUrls: ['./juegos.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonIcon, IonButton, CommonModule,
    BalanzaComponent
  ]
})
export class JuegosPage implements OnInit {
  usuarioActual: any = null;
  esAnonimo: boolean = false;
  descuentoGanado: number = 0;
  yaJugo: boolean = false;

  vistaActual: string = 'menu';
  tituloHeader: string = 'Juegos y Descuentos';

  constructor(
    private router: Router,
    private authService: AuthService,
    private dbService: DatabaseService
  ) {
    addIcons({ gameControllerOutline, trophyOutline, starOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.authService.usuario$.subscribe(user => {
      if (user) {
        this.esAnonimo = user.email?.includes('anonimo') || false;
        this.usuarioActual = user;

        if (!this.esAnonimo) {
          this.dbService.obtenerDescuentoCliente(user.uid).subscribe(data => {
            if (data) {
              this.descuentoGanado = data.descuentoGanado || 0;
              this.yaJugo = data.juegoJugado || false;
            }
          });
        }
      }
    });
  }

  abrirJuego(juego: string, titulo: string) {
    this.vistaActual = juego;
    this.tituloHeader = titulo;
  }

  volverAlMenu() {
    this.vistaActual = 'menu';
    this.tituloHeader = 'Juegos y Descuentos';
  }

  async procesarResultadoJuego(resultado: { gano: boolean, descuento: number }) {
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      if (resultado.gano) {
        await this.dbService.guardarDescuentoGanado(this.usuarioActual.uid, resultado.descuento);
      } else {
        await this.dbService.registrarIntentoFallido(this.usuarioActual.uid);
      }
    }
  }
}