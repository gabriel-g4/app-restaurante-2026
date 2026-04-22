import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule],
})
export class SplashPage implements OnInit {

  empresa = "AppRestaurante";
creadores = [
  "Anahí González",
  "Mariano Novak",
  "Gabriel García"
];

  constructor(private router: Router) {}

  ngOnInit() {
    SplashScreen.hide();

  setTimeout(() => {
    this.router.navigate(['/login']);
  }, 5600);

    // this.startSplashTimer();
  }

//   @HostListener('click')
//   onScreenTap() {
//     const sonido = new Audio('assets/sounds/splash.mp3')
//     sonido.play();
//     if (!this.isAnimating) {
//       this.playAnimation();
//     }
//   }

}
