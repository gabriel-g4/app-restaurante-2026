import { Component, OnInit } from '@angular/core';
import {IonicModule} from '@ionic/angular';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.scss'],
  standalone: true, //independiente 
  imports: [IonicModule]
})
export class HomeAdminComponent  implements OnInit {

  constructor(private router: Router,

  ) { }

  ngOnInit() {}

  agregarEmpleado() {
  this.router.navigate(['new-employee']);
  }
}
