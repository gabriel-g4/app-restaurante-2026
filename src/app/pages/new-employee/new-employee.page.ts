import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, camera, qrCodeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';


@Component({
  selector: 'app-new-employee',
  templateUrl: './new-employee.page.html',
  styleUrls: ['./new-employee.page.scss'],
  standalone: true,
  imports: [IonContent,
    IonHeader,
    IonTitle, 
    IonToolbar, CommonModule,
    FormsModule,
    IonButtons,IonButton,
    IonBackButton,IonIcon,ReactiveFormsModule,]
})
export class NewEmployeePage implements OnInit {

  constructor(private router: Router) {
  addIcons({ qrCodeOutline, camera });
  }

  ngOnInit() {
  }

}
