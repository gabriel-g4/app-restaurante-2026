import { Component, OnInit } from '@angular/core';
import { 
  IonContent, 
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle
 } from '@ionic/angular/standalone'
 import { addIcons } from 'ionicons';
import { power, people, personAddOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-home-maitre',
  templateUrl: './home-maitre.component.html',
  styleUrls: ['./home-maitre.component.scss'],
  imports: [
    IonContent,
    IonIcon,
    IonButton,
  ]
})
export class HomeMaitreComponent  implements OnInit {

  constructor(private router: Router, private auth: AuthService, private db: DatabaseService) {
    addIcons({
      people,
      personAddOutline,
      power
    })
   }

  ngOnInit() {
    
  }

  agregarCliente() {
    this.router.navigate(['register'])
  }

  async cerrarSesion() {
    await this.auth.cerrarSesion();
  }

  accederListaDeEspera() {
    this.router.navigate(['wait-list-maitre'])
  }

}