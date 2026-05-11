import { Component, OnInit } from '@angular/core';
import { 
  IonContent, 
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  AlertController
 } from '@ionic/angular/standalone'
 import { addIcons } from 'ionicons';
import { power, people, personAddOutline, qrCodeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DialogService } from 'src/app/services/dialog.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

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

  qrDEBUG: any;

  constructor(private router: Router, private auth: AuthService, private db: DatabaseService, private alertController: AlertController, private dialogService: DialogService) {
    addIcons({
      people,
      personAddOutline,
      power,
      qrCodeOutline
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

  async escanearQRDebug() {
    try {
      const alert = await this.alertController.create({
        header: 'Ingresar QR',

        inputs: [
          {
            name: 'qr',
            type: 'text',
            placeholder: 'Escribí el valor'
          }
        ],

        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Aceptar'
          }
        ]
      });

      await alert.present();

      const resultado = await alert.onDidDismiss();

      this.qrDEBUG = resultado.data?.values?.qr;

      console.log('Valor del QR escaneado:', this.qrDEBUG);

      if (!this.qrDEBUG) {
        throw new Error('QR vacío.');
      }


      if (this.qrDEBUG!.startsWith('mesa_')) {
        await this.manejarQRMesa(this.qrDEBUG!);
        return;
      }

      // QR no reconocido
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast('QR no reconocido.', 'danger');
    } catch (error) {
      console.error('Error al intentar escanear el QR', error);
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast(
        'Error al intentar escanear el QR.',
        'danger'
      );
    }
  }

  async escanearQR() {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        console.error('Permiso de cámara denegado para el escáner');
        return;
      }

      const { barcodes } = await BarcodeScanner.scan();

      if (barcodes.length > 0) {
        const qrData = barcodes[0].rawValue;

        console.log('Valor del QR escaneado:', qrData);

        if (!qrData) {
          throw new Error('QR vacío.');
        }

        if (qrData!.startsWith('mesa_')) {
          await this.manejarQRMesa(qrData!);
          return;
        }

        // QR no reconocido
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.dialogService.presentToast('QR no reconocido.', 'danger');
      }
    } catch (error) {
      console.error('Error al intentar escanear el QR', error);
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast(
        'Error al intentar escanear el QR.',
        'danger'
      );
    }
  }

  private async manejarQRMesa(qrValue: string) {
    const numeroMesa = parseInt(qrValue.split('_')[1]);

    this.router.navigate(['/informacion-mesa/', numeroMesa]);


  }

}