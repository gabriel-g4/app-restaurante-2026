import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { DialogService } from 'src/app/services/dialog.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { qrCodeOutline } from 'ionicons/icons';


@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.scss'],
  standalone: true, //independiente 
  imports: [IonicModule]
})
export class HomeAdminComponent implements OnInit {

  constructor(private router: Router,
    private dialogService: DialogService,
  ) { 
    addIcons({qrCodeOutline})
  }

  ngOnInit() { }

  agregarEmpleado() {
    this.router.navigate(['new-employee']);
  }

  agregarMesa() {
    this.router.navigate(['new-table']);
  }

  gestionarClientes() {
    this.router.navigate(['gestionar-clientes']);
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
