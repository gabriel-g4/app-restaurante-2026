import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton, IonIcon, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbles, qrCodeOutline, restaurantOutline,
  gameControllerOutline, statsChartOutline, cashOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DialogService } from 'src/app/services/dialog.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home-cliente',
  templateUrl: './home-cliente.component.html',
  styleUrls: ['./home-cliente.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonFab, IonFabButton],
})
export class HomeClienteComponent implements OnInit {
  constructor(
    private router: Router,
    private dialogService: DialogService,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private pedidoService: PedidoService,
    private alertController: AlertController
  ) {
    addIcons({
      chatbubbles,
      qrCodeOutline,
      restaurantOutline,
      gameControllerOutline,
      statsChartOutline,
      cashOutline,
    });
  }

  usuarioActual: any;
  private pedidoActual: any = null;
  esAnonimo: boolean = true;
  pedidoDeliveryActivo: boolean = false;


  qrDEBUG: any;

  ngOnInit() {
    this.authService.usuario$.subscribe((usuario) => {
      this.usuarioActual = usuario;
      console.log('USUARIO ACTUAL HOME CLIENTE: ');
      console.log(usuario);
    });

    this.suscribirAPedidoUsuario();
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

      // Manejar QR de lista de espera
      if (this.qrDEBUG === 'wait-list') {
        this.router.navigate(['/wait-list']);
        return;
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

        // Manejar QR de lista de espera
        if (qrData === 'wait-list') {
          this.router.navigate(['/wait-list']);
          return;
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

  navegar(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  irAlChat() {
    this.router.navigate(['/chat']);
  }

  private async suscribirAPedidoUsuario() {
    if (!this.usuarioActual) return;
    console.log('usuarioAuth: ', this.usuarioActual);
    const usuarioDb = await this.databaseService.obtenerUsuarioPorId(
      this.usuarioActual.uid
    );
    this.esAnonimo = usuarioDb.esAnonimo;

    this.pedidoService.suscribirAPedidosPorUsuario(
      this.usuarioActual.uid,
      [
        // Estados de pedidos en local y delivery
        'esperando mesa',
        'mesa asignada',
        'pedido hecho',
        'cocina lista',
        'bebida lista',
        'confirmado',
        'en preparación',
        'listo para servir',
        'servido',
        'pedido servido',
        'pedir la cuenta',
        'cuenta entregada',
        'pagado',
        'rechazado',
        'pendiente_confirmacion',
        'en camino',
        'entregado',
        'cancelado',
      ],
      (pedidos) => {
        if (pedidos && pedidos.length > 0) {
          // Ordenar por fecha para obtener el más reciente
          const pedidosOrdenados = pedidos.sort((a, b) => {
            const fechaA = a.fecha?.toDate()?.getTime() || 0;
            const fechaB = b.fecha?.toDate()?.getTime() || 0;
            return fechaB - fechaA;
          });
          this.pedidoActual = pedidosOrdenados[0];
          console.log(
            '[DEBUG] Pedido más reciente encontrado:',
            this.pedidoActual
          );

          // Verificar si es un pedido de delivery activo
          const estadosFinalesDelivery = [
            'pago confirmado',
            'cancelado',
            'rechazado',
          ];

          const esTipoDelivery = this.pedidoActual.tipo === 'delivery';
          const noEsEstadoFinal = !estadosFinalesDelivery.includes(
            this.pedidoActual.estado
          );

          console.log(
            `[DEBUG] ¿Es tipo delivery? -> ${esTipoDelivery} (tipo: '${this.pedidoActual.tipo}')`
          );
          console.log(
            `[DEBUG] ¿No es estado final? -> ${noEsEstadoFinal} (estado: '${this.pedidoActual.estado}')`
          );

          this.pedidoDeliveryActivo = esTipoDelivery && noEsEstadoFinal;

          console.log(
            '[DEBUG] Resultado final de pedidoDeliveryActivo:',
            this.pedidoDeliveryActivo
          );
        } else {
          this.pedidoActual = null;
          this.pedidoDeliveryActivo = false;
          console.log(
            '[DEBUG] No se encontraron pedidos para el usuario. pedidoDeliveryActivo es false.'
          );
        }
      },
      (error) => {
        console.error('Error al obtener pedido:', error);
      }
    );
  }

  private async manejarQRMesa(qrValue: string) {
    const numeroMesa = parseInt(qrValue.split('_')[1]);

    if (!this.pedidoActual) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast('No tiene un pedido asignado', 'danger');
      return;
    }

    console.log('Pedido actual:', this.pedidoActual.estado);
    const estado = await this.pedidoService.obtenerEstadoPedido(
      this.pedidoActual.id
    );
    console.log('Estado del pedido:', estado);

    if ('pagado' == estado || 'pago confirmado' == estado) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast(
        'Su pedido ya fue finalizado. No puede volver a la mesa.'
      );
      return;
    }

    if (!this.pedidoActual.idMesa) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast('Aún no tiene mesa asignada.');
      return;
    }

    if (this.pedidoActual.idMesa !== numeroMesa) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast(
        `Esta no es su mesa asignada. Mesa asignada: ${this.pedidoActual.idMesa}`
      );
      return;
    }

    console.log(this.pedidoActual.estado === 'rechazado');
    if (
      this.pedidoActual.estado === 'mesa asignada' ||
      this.pedidoActual.estado === 'rechazado'
    ) {
      this.router.navigate(['/menu']);
    } else {
      this.router.navigate(['/menu-principal']);
    }
  }
}