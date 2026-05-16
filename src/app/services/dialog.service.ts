import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private toastController: ToastController, private alertController: AlertController) { }

  async presentToast(message: string, color: string = 'primary', duration: number = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'bottom',
      cssClass: 'mi-toast'
    });
    await toast.present();
  }

  async presentAlert(header: string, message: string, buttons: any[] = ['Aceptar']) {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: 'mi-alerta', // Por ahora no existe.
      buttons
    });
    await alert.present();
  }

}
