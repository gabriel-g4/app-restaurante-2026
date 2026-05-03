import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline, arrowDownOutline, restaurantOutline, refreshOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-juego-balanza',
  templateUrl: './balanza.component.html',
  styleUrls: ['./balanza.component.scss'],
  standalone: true,
  imports: [IonToolbar, IonHeader, IonContent, CommonModule, IonButton, IonIcon]
})
export class BalanzaComponent implements OnInit {
  @Input() esAnonimo: boolean = false;
  @Input() yaJugo: boolean = false;
  @Input() descuentoGanado: number = 0;

  @Output() resultado = new EventEmitter<{ gano: boolean, descuento: number }>();

  alimentos = [
    { nombre: 'Ensalada Mixta', calorias: 150, emoji: '🥗' },
    { nombre: 'Papas Fritas', calorias: 310, emoji: '🍟' },
    { nombre: 'Hamburguesa', calorias: 550, emoji: '🍔' },
    { nombre: 'Helado', calorias: 280, emoji: '🍨' },
    { nombre: 'Manzana', calorias: 52, emoji: '🍎' },
    { nombre: 'Pizza', calorias: 260, emoji: '🍕' }
  ];

  alimentoActual: any;
  siguienteAlimento: any;

  puntos: number = 0;
  estado: 'jugando' | 'ganado' | 'perdido' = 'jugando';
  mensajeFinal: string = '';

  constructor() {
    addIcons({ arrowUpOutline, arrowDownOutline, restaurantOutline, refreshOutline });
  }

  ngOnInit() {
    this.iniciarJuego();
  }

  iniciarJuego() {
    this.puntos = 0;
    this.estado = 'jugando';
    this.alimentos = this.alimentos.sort(() => Math.random() - 0.5);
    this.alimentoActual = this.alimentos[0];
    this.siguienteAlimento = this.alimentos[1];
  }

  async evaluar(eleccion: 'mayor' | 'menor') {
    const esMayor = this.siguienteAlimento.calorias >= this.alimentoActual.calorias;
    const acierto = (eleccion === 'mayor' && esMayor) || (eleccion === 'menor' && !esMayor);

    if (acierto) {
      await Haptics.impact({ style: ImpactStyle.Light });
      this.puntos++;

      if (this.puntos === 3) {
        this.procesarVictoria();
      } else {
        this.alimentoActual = this.siguienteAlimento;
        this.siguienteAlimento = this.alimentos[this.puntos + 1];
      }
    } else {
      await Haptics.impact({ style: ImpactStyle.Heavy }); // REGLA: Vibrar en error
      this.procesarDerrota();
    }
  }

  procesarVictoria() {
    this.estado = 'ganado';
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      this.mensajeFinal = "¡Felicidades! Acabas de ganar un 10% de descuento.";
      this.resultado.emit({ gano: true, descuento: 10 }); // Avisamos al padre
    } else {
      this.mensajeFinal = "¡Ganaste! (Has jugado por diversión).";
    }
  }

  procesarDerrota() {
    this.estado = 'perdido';
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      this.mensajeFinal = "¡Perdiste tu oportunidad! Pero puedes seguir jugando para divertirte.";
      this.resultado.emit({ gano: false, descuento: 10 }); // Avisamos al padre
    } else {
      this.mensajeFinal = "¡Casi! Inténtalo de nuevo.";
    }
  }
}