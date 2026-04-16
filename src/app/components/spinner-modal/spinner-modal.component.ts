import { Component, OnInit } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone'

@Component({
  selector: 'app-spinner-modal',
  templateUrl: './spinner-modal.component.html',
  styleUrls: ['./spinner-modal.component.scss'],
  imports: [IonSpinner]
})
export class SpinnerModalComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
