import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  qrCodeOutline,
  clipboardOutline,
  cashOutline,
  notificationsOutline
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DialogService } from 'src/app/services/dialog.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-home-mozo',
  templateUrl: './home-mozo.component.html',
  styleUrls: ['./home-mozo.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon]
})
export class HomeMozoComponent implements OnInit {

  constructor(private router: Router, private dialogService: DialogService) {
    addIcons({
      chatbubblesOutline,
      qrCodeOutline,
      clipboardOutline,
      cashOutline,
      notificationsOutline
    });
  }

  ngOnInit() { }

  navegar(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  irAlChat() {
    this.router.navigate(['/chat']);
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