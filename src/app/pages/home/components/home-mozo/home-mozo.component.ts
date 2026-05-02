import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  qrCodeOutline,
  clipboardOutline,
  cashOutline,
  notificationsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home-mozo',
  templateUrl: './home-mozo.component.html',
  styleUrls: ['./home-mozo.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon]
})
export class HomeMozoComponent implements OnInit {

  constructor(private router: Router) {
    addIcons({
      chatbubblesOutline,
      qrCodeOutline,
      clipboardOutline,
      cashOutline,
      notificationsOutline
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