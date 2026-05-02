import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton, IonIcon, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbles, qrCodeOutline, restaurantOutline,
  gameControllerOutline, statsChartOutline, cashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home-cliente',
  templateUrl: './home-cliente.component.html',
  styleUrls: ['./home-cliente.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonFab, IonFabButton]
})
export class HomeClienteComponent implements OnInit {

  constructor(private router: Router) {
    addIcons({
      chatbubbles,
      qrCodeOutline,
      restaurantOutline,
      gameControllerOutline,
      statsChartOutline,
      cashOutline
    });
  }

  ngOnInit() { }

  navegar(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  irAlChat() {
    this.router.navigate(['/chat']);
  }
}