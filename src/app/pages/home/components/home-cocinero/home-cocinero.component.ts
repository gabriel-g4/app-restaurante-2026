import { Component, OnInit } from '@angular/core';
import {IonicModule} from '@ionic/angular';

@Component({
  selector: 'app-home-cocinero',
  templateUrl: './home-cocinero.component.html',
  styleUrls: ['./home-cocinero.component.scss'],
  standalone: true, //independiente 
  imports: [IonicModule]
})
export class HomeCocineroComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
