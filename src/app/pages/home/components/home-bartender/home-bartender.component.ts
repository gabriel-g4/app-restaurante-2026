import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home-bartender',
  templateUrl: './home-bartender.component.html',
  styleUrls: ['./home-bartender.component.scss'],
  imports: [IonicModule]
})
export class HomeBartenderComponent  implements OnInit {

  constructor(private router: Router, private auth: AuthService,) { }

  ngOnInit() {}

  agregarBebida() {
    this.router.navigate(['new-beverage']);
  }

  accederPedidosPendientes( ){}
}
