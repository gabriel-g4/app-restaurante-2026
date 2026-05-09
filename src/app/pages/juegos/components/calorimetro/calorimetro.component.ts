import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline, arrowDownOutline, restaurantOutline, refreshOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-juego-calorimetro',
  templateUrl: './calorimetro.component.html',
  styleUrls: ['./calorimetro.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class CalorimetroComponent implements OnInit {
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
  estado: 'jugando' | 'revelando' | 'ganado' | 'perdido' = 'jugando';
  esAcierto: boolean = false;
  animando: boolean = false;
  mensajeFinal: string = '';

  constructor() {
    addIcons({ arrowUpOutline, arrowDownOutline, restaurantOutline, refreshOutline, checkmarkCircleOutline, closeCircleOutline });
  }

  ngOnInit() { this.iniciarJuego(); }

  iniciarJuego() {
    this.puntos = 0;
    this.estado = 'jugando';
    this.animando = false;
    this.alimentos = this.alimentos.sort(() => Math.random() - 0.5);
    this.alimentoActual = this.alimentos[0];
    this.siguienteAlimento = this.alimentos[1];
  }

  async evaluar(eleccion: 'mayor' | 'menor') {
    const esMayor = this.siguienteAlimento.calorias >= this.alimentoActual.calorias;
    this.esAcierto = (eleccion === 'mayor' && esMayor) || (eleccion === 'menor' && !esMayor);

    this.estado = 'revelando';

    if (this.esAcierto) {
      await Haptics.impact({ style: ImpactStyle.Light });
      setTimeout(() => {
        this.animando = true;

        setTimeout(() => {
          this.puntos++;
          if (this.puntos === 3) {
            this.procesarVictoria();
          } else {
            this.alimentoActual = this.siguienteAlimento;
            this.siguienteAlimento = this.alimentos[this.puntos + 1];
            this.estado = 'jugando';
            this.animando = false;
          }
        }, 500);
      }, 1500);
    } else {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      setTimeout(() => {
        this.procesarDerrota();
      }, 2000);
    }
  }

  procesarVictoria() {
    this.estado = 'ganado';
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      this.mensajeFinal = "Ganaste un 10% de descuento.";
      this.resultado.emit({ gano: true, descuento: 10 });
    } else {
      this.mensajeFinal = "Podés seguir jugando todas las veces que quieras.";
    }
  }

  procesarDerrota() {
    this.estado = 'perdido';
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      this.mensajeFinal = "Te quedaste sin tu oportunidad de descuento, pero podés seguir jugando para divertirte.";
      this.resultado.emit({ gano: false, descuento: 10 });
    } else {
      this.mensajeFinal = "Intentalo de nuevo.";
    }
  }
}