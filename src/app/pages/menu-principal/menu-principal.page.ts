import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton, IonIcon, IonFab, IonFabButton, ModalController, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbles, qrCodeOutline, restaurantOutline,
  gameControllerOutline, statsChartOutline, cashOutline,
  timeOutline,
  documentTextOutline,
  chatbubblesOutline,
  receiptOutline,
  cardOutline,
  fastFoodOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DialogService } from 'src/app/services/dialog.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { AlertController } from '@ionic/angular/standalone';
import { DescripcionPedidoModal } from 'src/app/components/descripcion-pedido-modal/descripcion-pedido-modal.modal';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { RealizarPagoModalComponent } from 'src/app/components/realizar-pago-modal/realizar-pago-modal.component';


@Component({
  selector: 'app-menu-principal',
  templateUrl: './menu-principal.page.html',
  styleUrls: ['./menu-principal.page.scss'],
  standalone: true,
  imports: [ IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon ]
})
export class MenuPrincipalPage implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private dialogService: DialogService,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private pedidoService: PedidoService,
    private alertController: AlertController,
    private modalController: ModalController,
    private notificationSenderService: NotificationSenderService
  ) {
    addIcons({
      chatbubbles,
      qrCodeOutline,
      restaurantOutline,
      gameControllerOutline,
      statsChartOutline,
      cashOutline,
      timeOutline,
      documentTextOutline,
      chatbubblesOutline,
      receiptOutline,
      cardOutline,
      fastFoodOutline
    });
  }

  usuarioActual: any;
  pedidoActual: any = null;
  esAnonimo: boolean = true;
  pedidoDeliveryActivo: boolean = false;


  ngOnInit() {
    this.cargarPedidoActual();
    console.log(this.pedidoActual);
  }

  ngOnDestroy(): void {
    this.pedidoService.cancelarSuscripcion();
  }
  async cargarPedidoActual() {
    // Intentar obtener usuario varias veces con retry
    let intentos = 0;
    const maxIntentos = 5;
    const delay = 500; // ms entre intentos

    const checkUser = async (): Promise<any> => {
      const usuario = await this.authService.getCurrentUserAsync();
      if (usuario || intentos >= maxIntentos) {
        return usuario;
      }
      intentos++;
      await new Promise(resolve => setTimeout(resolve, delay));
      return checkUser();
    };

    const usuario = await checkUser();

    if (!usuario) {
      console.error('Usuario no autenticado después de varios intentos');
      return;
    }

    console.log('Usuario obtenido:', usuario.uid);

    const usuarioBD = await this.databaseService.obtenerUsuarioPorId(usuario.uid);

    if (usuarioBD && usuarioBD.esAnonimo !== undefined) {
      this.esAnonimo = usuarioBD.esAnonimo;
      console.log("¿Es anónimo?:", this.esAnonimo);
    }

    // Usar el método existente del servicio sin modificarlo
    this.pedidoService.suscribirAPedidos(
      ['pedido hecho', 'en preparación', 'cocina lista', 'bebida lista', 'listo para servir', 'servido', 'pedido servido', 'pedir la cuenta', 'cuenta entregada', 'pagado', 'rechazado', 'confirmado', "pendiente_confirmacion", 'en camino', 'entregado', 'mesa asignada'],
      (pedidos) => {
        // Filtrar manualmente por usuario
        const pedidosUsuario = pedidos.filter(p => p.idUsuario === usuario.uid);

        // Ordenar por fecha
        const pedidosOrdenados = pedidosUsuario.sort((a, b) => {
          const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return fechaB - fechaA;
        });

        this.pedidoActual = pedidosOrdenados[0] || null;

        if (!this.pedidoActual) {
          console.warn('No se encontraron pedidos para este usuario');
          this.pedidoDeliveryActivo = false;
        } else {
          console.log("PEDIDO ACTUAL: ", this.pedidoActual);

          // Lógica para verificar si es un pedido de delivery activo
          const estadosFinalesDelivery = ['pago confirmado', 'cancelado', 'rechazado', 'entregado'];
          
          const esTipoDelivery = this.pedidoActual.tipo === 'delivery';
          const noEsEstadoFinal = !estadosFinalesDelivery.includes(this.pedidoActual.estado);

          console.log(`[DEBUG] ¿Es tipo delivery? -> ${esTipoDelivery} (tipo: '${this.pedidoActual.tipo}')`);
          console.log(`[DEBUG] ¿No es estado final? -> ${noEsEstadoFinal} (estado: '${this.pedidoActual.estado}')`);

          this.pedidoDeliveryActivo = esTipoDelivery && noEsEstadoFinal;

          console.log('[DEBUG] Resultado final de pedidoDeliveryActivo:', this.pedidoDeliveryActivo);
        }
      },

    );
  }

  navegar(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  irAlChat() {
    this.router.navigate(['/chat']);
  }

    async marcarComoServido() {
    try {
      await this.pedidoService.actualizarEstadoPedido(
        this.pedidoActual.id,
        'pedido servido',
        'Pedido marcado como servido'
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  }

  async pedirLaCuenta() {



    try {
      await this.pedidoService.actualizarEstadoPedido(
        this.pedidoActual.id,
        'pedir la cuenta',
        'Cuenta solicitada'
      );

      let body = "";
      let roles = ['mozo'];
      if (this.pedidoActual.tipo === 'delivery') {
        body = `El pedido de reparto #${this.pedidoActual.idPedido} solicita la cuenta.`;
        roles = ['repartidor'];
      } else {
        body = `La mesa ${this.pedidoActual.idMesa} solicita la cuenta.`;
      }
      
      this.notificationSenderService.enviarNotificacion({
        title: 'Pedir cuenta',
        body: body,
        roles: roles,
        path: 'client-approval',
        collection: 'usuarios',
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }


  }

  async verEstadoPedido() {
    const modal = await this.modalController.create({
      component: DescripcionPedidoModal,
      componentProps: {
        pedido: this.pedidoActual
      },
      cssClass: 'detalle-pedido-modal'
    });
    await modal.present();
  }

  async irAPagar() {
    try {

      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        console.error('Permiso de cámara denegado para el escáner');
        return;
      }


      if (!this.pedidoActual) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.dialogService.presentToast('El pedido aún no está disponible.');
        return;
      }

      const pedidoClonado = { ...this.pedidoActual };

      const { barcodes } = await BarcodeScanner.scan();

      if (barcodes.length > 0) {
        const qrValue = barcodes[0].rawValue;

        if (!qrValue) {
          await Haptics.impact({ style: ImpactStyle.Heavy });
          this.dialogService.presentToast('Formato QR incorrecto. Debe ser "propina_X"');
          return;
        }
        
        console.log('QR escaneado:', qrValue);

        // Validar formato de propina
        if (qrValue.startsWith('propina_')) {
          const porcentaje = parseInt(qrValue.split('_')[1]);

          // Validar porcentajes permitidos
          if ([0, 5, 10, 15, 20].includes(porcentaje)) {
            // Mostrar modal de confirmación con propina
            const confirmModal = await this.modalController.create({
              component: RealizarPagoModalComponent,
              componentProps: {
                pedido: pedidoClonado,
                porcentajePropina: porcentaje
              },
              cssClass: 'pago-confirm-modal'
            });

            await confirmModal.present();

            // Opcional: Manejar el resultado del modal de confirmación
            const { data: confirmData } = await confirmModal.onDidDismiss();
            if (confirmData?.pagoRealizado) {
              console.log('Pago confirmado con éxito');
            }
          } else {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            this.dialogService.presentToast('Porcentaje no válido. Use: 0, 5, 10, 15 o 20');
          }
        } else {
          await Haptics.impact({ style: ImpactStyle.Heavy });
          this.dialogService.presentToast('Formato QR incorrecto. Debe ser "propina_X"');
        }
      } else {
        console.log('Escaneo cancelado');
      }
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast('Error al procesar el pago');
    }
  }

  async irAEncuesta() {

    if (this.pedidoActual) {
      const pedidoClonado = { ...this.pedidoActual };
      this.router.navigate(['/menu-encuesta'], {
        queryParams: {
          pedido: JSON.stringify(pedidoClonado)
        }
      });
    } else {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast('No hay un pedido actual para completar la encuesta');
    }
  }

}