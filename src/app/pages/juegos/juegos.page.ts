import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { CommonModule } from '@angular/common';
import { PedidoService } from 'src/app/services/pedido.service';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonIcon, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gameControllerOutline, trophyOutline, starOutline, arrowBackOutline } from 'ionicons/icons';
import { CalorimetroComponent } from './components/calorimetro/calorimetro.component';
import { MemotestComponent } from "./components/memotest/memotest.component";
import { SimonDiceComponent } from './components/simon-dice/simon-dice.component';



@Component({
  selector: 'app-juegos',
  templateUrl: './juegos.page.html',
  styleUrls: ['./juegos.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonIcon, IonButton, CommonModule, CalorimetroComponent,
    MemotestComponent, SimonDiceComponent
  ]
})
export class JuegosPage implements OnInit {
  usuarioActual: any = null;
  esAnonimo: boolean = false;
  descuentoGanado: number = 0;
  yaJugo: boolean = false;

  pedidoActualId: string | null = null;

  vistaActual: string = 'menu';
  tituloHeader: string = 'Juegos y Descuentos';

  constructor(
    private router: Router,
    private authService: AuthService,
    private dbService: DatabaseService,
    private pedidoService: PedidoService
  ) {
    addIcons({ gameControllerOutline, trophyOutline, starOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.authService.usuario$.subscribe(async user => {
      if (user) {
        this.esAnonimo = user.email?.includes('anonimo') || false;
        this.usuarioActual = user;

        if (!this.esAnonimo) {
          const pedido = await this.pedidoService.obtenerPedidoActivo(user.uid);

          if (pedido) {
            this.pedidoActualId = pedido.id;
            this.yaJugo = pedido.jugo || false;
            this.descuentoGanado = pedido.descuento || 0;
          }
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

  async procesarResultadoJuego(resultado: any) {
    console.log('Resultado del juego:', resultado);

    if (resultado.porDiversion) {
      return;
    }

    this.yaJugo = true;

    if (resultado.gano) {
      this.descuentoGanado = resultado.descuento;
    } else {
      this.descuentoGanado = 0;
    }

    if (!this.esAnonimo && this.pedidoActualId) {
      try {
        await this.pedidoService.actualizarJuegoPedido(
          this.pedidoActualId,
          true,
          this.descuentoGanado
        );
      } catch (error) {
        console.error('No se pudo guardar el descuento en el pedido.');
      }
    }
  }
}