import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline, refreshOutline, informationCircleOutline, checkmarkCircleOutline, ticketOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-juego-memotest',
  templateUrl: './memotest.component.html',
  styleUrls: ['./memotest.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class MemotestComponent implements OnInit {
  @Input() esAnonimo: boolean = false;
  @Input() yaJugo: boolean = false;
  @Input() descuentoGanado: number = 0;
  @Output() resultado = new EventEmitter<{ gano: boolean, descuento: number, porDiversion?: boolean }>();

  emojis = ['🍕', '🍔', '🌭', '🍿', '🍩', '🥑'];
  cartas: any[] = [];
  cartasVolteadas: any[] = [];
  movimientos: number = 0;
  paresEncontrados: number = 0;
  maxMovimientos: number = 18;
  teniaDescuentoPreviamente: boolean = false;

  estado: 'jugando' | 'ganado' | 'perdido' = 'jugando';
  mensajeFinal: string = '';
  bloqueado: boolean = false;

  constructor() { addIcons({ informationCircleOutline, checkmarkCircleOutline, ticketOutline, refreshOutline, restaurantOutline }); }

  ngOnInit() { this.iniciarJuego(); }

  iniciarJuego() {
    this.movimientos = 0;
    this.paresEncontrados = 0;
    this.estado = 'jugando';
    this.cartasVolteadas = [];
    this.bloqueado = false;

    let mazo = [...this.emojis, ...this.emojis];
    mazo = mazo.sort(() => Math.random() - 0.5);

    this.cartas = mazo.map((emoji, index) => ({
      id: index,
      emoji: emoji,
      volteada: false,
      encontrada: false
    }));
    this.teniaDescuentoPreviamente = (this.descuentoGanado > 0);
  }

  async voltearCarta(carta: any) {
    if (this.bloqueado || carta.volteada || carta.encontrada) return;

    await Haptics.impact({ style: ImpactStyle.Light });
    carta.volteada = true;
    this.cartasVolteadas.push(carta);

    if (this.cartasVolteadas.length === 2) {
      this.bloqueado = true;
      this.movimientos++;
      this.verificarPar();
    }
  }

  async verificarPar() {
    const [c1, c2] = this.cartasVolteadas;

    if (c1.emoji === c2.emoji) {
      c1.encontrada = true;
      c2.encontrada = true;
      this.paresEncontrados++;
      this.cartasVolteadas = [];
      this.bloqueado = false;

      if (this.paresEncontrados === 6) this.procesarVictoria();
    } else {
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        c1.volteada = false;
        c2.volteada = false;
        this.cartasVolteadas = [];
        this.bloqueado = false;

        if (this.movimientos >= this.maxMovimientos) this.procesarDerrota();
      }, 1000);
    }
  }

  procesarVictoria() {
    setTimeout(() => {
      this.estado = 'ganado';
      if (!this.esAnonimo && !this.teniaDescuentoPreviamente) {
        this.mensajeFinal = "¡Ganaste un 15% de descuento!";
        this.resultado.emit({ gano: true, descuento: 15 });
      } else {
        this.mensajeFinal = "¡Bien jugado! Pero ya tenías un descuento aplicado.";
        this.resultado.emit({ gano: true, descuento: this.descuentoGanado, porDiversion: true });
      }
    }, 1000);
  }

  procesarDerrota() {
    this.estado = 'perdido';

    if (!this.esAnonimo && !this.yaJugo) {
      this.mensajeFinal = "No lograste el descuento esta vez.";
      this.resultado.emit({ gano: false, descuento: 0, porDiversion: false });
    } else {
      this.mensajeFinal = "Jugaste por diversión.";
      this.resultado.emit({ gano: false, descuento: 0, porDiversion: true });
    }
  }
}