import { Component, OnInit } from '@angular/core';
import {IonicModule} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { addIcons } from 'ionicons';


@Component({
  selector: 'app-home-cocinero',
  templateUrl: './home-cocinero.component.html',
  styleUrls: ['./home-cocinero.component.scss'],
  standalone: true, //independiente 
  imports: [IonicModule]
})
export class HomeCocineroComponent  implements OnInit {

  constructor(private router: Router, private auth: AuthService) { }

  ngOnInit() {}

  agregarPlato() {
    this.router.navigate(['new-dish']);
  }

   accederPedidosPendientes() {
    this.router.navigate(['orders-cocinero']);
  }
}
