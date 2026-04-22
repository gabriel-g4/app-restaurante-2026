import { Component, OnInit } from '@angular/core';
import {IonicModule} from '@ionic/angular';

@Component({
  selector: 'app-home-mozo',
  templateUrl: './home-mozo.component.html',
  styleUrls: ['./home-mozo.component.scss'],
  standalone: true, //independiente 
  imports: [IonicModule]
})
export class HomeMozoComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
