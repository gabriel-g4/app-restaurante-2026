import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline, refreshOutline, playOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-juego-simon-dice',
  templateUrl: './simon-dice.component.html',
  styleUrls: ['./simon-dice.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class SimonDiceComponent implements OnInit {
  @Input() esAnonimo: boolean = false;
  @Input() yaJugo: boolean = false;
  @Input() descuentoGanado: number = 0;
  @Output() resultado = new EventEmitter<{ gano: boolean, descuento: number }>();

  ingredientes = [
    { id: 0, emoji: '🍅', nombre: 'Tomate', clase: 'btn-tomate' },
    { id: 1, emoji: '🧀', nombre: 'Queso', clase: 'btn-queso' },
    { id: 2, emoji: '🥩', nombre: 'Carne', clase: 'btn-carne' },
    { id: 3, emoji: '🥬', nombre: 'Lechuga', clase: 'btn-lechuga' }
  ];

  bolsaColores: number[] = [];

  secuenciaChef: number[] = [];
  secuenciaUsuario: number[] = [];
  rondaActual: number = 1;
  maxRondas: number = 7;

  estado: 'preparacion' | 'mostrando' | 'jugando' | 'ganado' | 'perdido' = 'preparacion';
  ingredienteIluminado: number | null = null;
  mensajeFinal: string = '';

  constructor() {
    addIcons({ restaurantOutline, refreshOutline, playOutline });
  }

  ngOnInit() { }

  iniciarJuego() {
    this.rondaActual = 1;
    this.secuenciaChef = [];
    this.bolsaColores = [];
    this.agregarPasoAlChef();
    this.reproducirSecuencia();
  }

  agregarPasoAlChef() {
    if (this.bolsaColores.length === 0) {
      this.bolsaColores = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    }

    const nuevoPaso = this.bolsaColores.pop()!;

    if (this.secuenciaChef.length > 0 && nuevoPaso === this.secuenciaChef[this.secuenciaChef.length - 1]) {
      if (this.bolsaColores.length > 0) {
        const pasoAlternativo = this.bolsaColores.pop()!;
        this.bolsaColores.push(nuevoPaso);
        this.secuenciaChef.push(pasoAlternativo);
        return;
      }
    }

    this.secuenciaChef.push(nuevoPaso);
  }

  esperar(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async reproducirSecuencia() {
    this.estado = 'mostrando';
    this.secuenciaUsuario = [];

    await this.esperar(800);

    for (let id of this.secuenciaChef) {
      this.ingredienteIluminado = id;
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.esperar(500);

      this.ingredienteIluminado = null;
      await this.esperar(300);
    }

    this.estado = 'jugando';
  }

  async tocarIngrediente(id: number) {
    if (this.estado !== 'jugando') return;

    await Haptics.impact({ style: ImpactStyle.Medium });
    this.ingredienteIluminado = id;
    setTimeout(() => this.ingredienteIluminado = null, 200);

    this.secuenciaUsuario.push(id);
    const indiceActual = this.secuenciaUsuario.length - 1;

    if (this.secuenciaUsuario[indiceActual] !== this.secuenciaChef[indiceActual]) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.procesarDerrota();
      return;
    }

    if (this.secuenciaUsuario.length === this.secuenciaChef.length) {
      if (this.rondaActual === this.maxRondas) {
        this.procesarVictoria();
      } else {
        this.rondaActual++;
        this.estado = 'mostrando';
        this.agregarPasoAlChef();
        await this.esperar(1000);
        this.reproducirSecuencia();
      }
    }
  }

  procesarVictoria() {
    this.estado = 'ganado';
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      this.mensajeFinal = "¡Receta perfecta! Ganaste un 20% de descuento.";
      this.resultado.emit({ gano: true, descuento: 20 });
    } else {
      this.mensajeFinal = "¡Ganaste! (Has jugado por diversión).";
    }
  }

  procesarDerrota() {
    this.estado = 'perdido';
    if (!this.esAnonimo && !this.yaJugo && this.descuentoGanado === 0) {
      this.mensajeFinal = "¡Te equivocaste de ingrediente! Perdiste tu intento oficial.";
      this.resultado.emit({ gano: false, descuento: 20 });
    } else {
      this.mensajeFinal = "¡Te equivocaste! Inténtalo de nuevo.";
    }
  }
}