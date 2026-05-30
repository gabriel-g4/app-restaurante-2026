import { CommonModule } from '@angular/common';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ModalController,
  IonSegment,
  IonSegmentButton,
  IonBackButton,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons';
import { chatbubblesOutline, checkmarkSharp, closeSharp, informationCircleOutline, logOutOutline, power, receiptOutline } from 'ionicons/icons';
// import { ConsultaModal } from 'src/app/components/consulta-modal/consulta-modal.modal';
import { DescripcionPedidoModal } from 'src/app/components/descripcion-pedido-modal/descripcion-pedido-modal.modal';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';
// import { FacturaComponent } from 'src/app/components/factura/factura.component';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DialogService } from 'src/app/services/dialog.service';
import { EmailService } from 'src/app/services/email.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { register } from 'swiper/element/bundle';
// register Swiper custom elements
register();

@Component({
  selector: 'app-pedidos-mozo',
  templateUrl: './pedidos-mozo.page.html',
  styleUrls: ['./pedidos-mozo.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
    IonSegment,
    IonSegmentButton,
    IonBackButton
    // FacturaComponent
  ]
})
export class PedidosMozoPage implements OnInit {



  pedidos: any[] = [];
  estadosPermitidos = ['pedido hecho', 'en preparación', 'cocina lista', 'bebida lista', 'listo para servir', 'pedir la cuenta', 'pagado', 'rechazado'];
  segment: string = 'pedido hecho';

  // @ViewChild(FacturaComponent) facturaComponent!: FacturaComponent;
  crearFactura = false;
  pedidoFactura: any = {}
  usuarioFactura: any = {}

  constructor(
    private router: Router,
    private auth: AuthService,
    private modalCtrl: ModalController,
    private dialogService: DialogService,
    private pedidoService: PedidoService,
    private db: DatabaseService,
    private notificationSenderService: NotificationSenderService,
  ) {
    addIcons({ chatbubblesOutline, logOutOutline, informationCircleOutline, receiptOutline, power, checkmarkSharp, closeSharp });
  }

  ngAfterViewInit() {
    // console.log("PADRE → AfterViewInit. FacturaComponent:", this.facturaComponent);
  }

  async ngOnInit() {
    this.suscribirAPedidos();

  }


  ngOnDestroy(): void {
    this.pedidoService.cancelarSuscripcion();
  }

  private suscribirAPedidos(): void {
    this.pedidoService.suscribirAPedidos(this.estadosPermitidos, (pedidos) => {
      // Filtrar para excluir pedidos de tipo 'delivery'
      const pedidosFiltrados = pedidos.filter(p => p.tipo !== 'delivery');
      console.log('Pedidos recibidos (sin delivery):', pedidosFiltrados);
      this.pedidos = pedidosFiltrados.sort((a, b) =>
        (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0) // Ordenar por fecha descendente
      );
    });
  }

  navigateTo(path: string) {
    this.router.navigate([`/${path}`]);
  }

 

  // async abrirConsulta() {
  //   const modal = await this.modalCtrl.create({
  //     component: ConsultaModal,
  //     showBackdrop: true,
  //     backdropDismiss: true,
  //     cssClass: 'consulta-modal-custom',

  //   });
  //   await modal.present();
  // }

  async verInfo(pedido: any) {
    const modal = await this.modalCtrl.create({
      component: DescripcionPedidoModal,
      componentProps: {
        pedido: pedido
      },
      cssClass: 'detalle-pedido-modal'
    });
    await modal.present();
  }

  async aceptarPedido(pedido: any) {
    await this.cambiarEstado(pedido);
    this.pedidos = this.pedidos.filter((x) => x !== pedido);
    this.notificationSenderService.enviarNotificacion({
      title: '¡Tu pedido fue aceptado!',
      body: `El mozo ha confirmado tu pedido #${pedido.idPedido}. Ya está en preparación.`,
      roles: ['cliente'],
      path: 'menu-principal',
      collection: 'usuarios',
    });
    this.dialogService.presentToast(`Pedido de Mesa ${pedido.idMesa} aceptado con éxito.`);
  }

  async rechazarPedido(pedido: any) {

    const loading = await this.modalCtrl.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });

    loading.present();

    // Estado y mensaje específicos para rechazo
    const nuevoEstado = 'rechazado';
    // const mensaje = 'Pedido rechazado con éxito.';
    const mensaje = `Pedido de Mesa ${pedido.idMesa} rechazado con éxito.`;


    // Actualizo en Firestore
    await this.pedidoService.actualizarEstadoPedido(pedido.id, nuevoEstado, mensaje);

    // Elimino de la lista local
    this.pedidos = this.pedidos.filter(x => x !== pedido);

    this.notificationSenderService.enviarNotificacion({
      title: 'Pedido Rechazado',
      body: `Su pedido ${pedido.idPedido} fue rechazado por un mozo.`,
      roles: ['cliente'],
      path: 'menu',
      collection: 'usuarios',
    });

    loading.dismiss();
    // Mensaje
    // this.dialogService.presentToast(`Pedido de Mesa ${pedido.idMesa} rechazado con éxito.`);
  }


  getBotonTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'pedido hecho': 'Empezar preparación',
      'listo para servir': 'Marcar como servido',
      'pedir la cuenta': 'Entregar cuenta',
      'pagado': 'Confirmar pago'
    };
    return textos[estado] || 'Cambiar estado';
  }

  getNuevoEstado(estadoActual: string): { estado: string, mensaje: string } {
    const estados: { [key: string]: { estado: string, mensaje: string } } = {
      'pedido hecho': { estado: 'en preparación', mensaje: 'Preparación iniciada' },
      'listo para servir': { estado: 'servido', mensaje: 'Pedido servido' },
      'pedir la cuenta': { estado: 'cuenta entregada', mensaje: 'Cuenta entregada' },
      'pagado': { estado: 'pago confirmado', mensaje: 'Pago confirmado' }
    };
    return estados[estadoActual] || { estado: estadoActual, mensaje: 'Estado actualizado' };
  }

  get pedidosFiltrados() {
    return this.pedidos.filter(
      p => p.estado.toLowerCase() === this.segment.toLowerCase()
    );
  }

  async cambiarEstado(pedido: any) {
    const loading = await this.modalCtrl.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });

    loading.present();
    const { estado: nuevoEstado, mensaje } = this.getNuevoEstado(pedido.estado);
    await this.pedidoService.actualizarEstadoPedido(pedido.id, nuevoEstado, mensaje);

    // Enviar notificación si es necesario si el estado cambia a en preparcion al cocinero y bartender
    if (nuevoEstado === 'en preparación') {
      this.notificationSenderService.enviarNotificacion({
        title: 'Nueva orden',
        body: `Nuevo pedido para preparar: ${pedido.idPedido}`,
        roles: ['cocinero', 'bartender'],
        path: 'home',
        collection: 'usuarios',
      });
    }

    if (nuevoEstado === 'pago confirmado') {
      console.log('Estado cambiado a pago confirmado para pedido:', pedido.idPedido);

      await this.pedidoService.liberarMesa(pedido.idMesa);
      console.log(`Mesa ${pedido.idMesa} liberada.`);

      this.notificationSenderService.enviarNotificacion({
        title: 'Pago confirmado',
        body: `Se transfirieron $${pedido.precioFinal} a la cuenta.`,
        roles: ['dueño', 'supervisor'],
        path: 'home',
        collection: 'usuarios',
      });
      console.log('Notificación de pago confirmado enviada.');

      const userData = await this.db.obtenerUsuarioPorId(pedido.idUsuario);
      console.log('Datos del usuario obtenidos:', userData);

      this.pedidoFactura = pedido;
      this.usuarioFactura = userData;
      this.crearFactura = true;
      console.log('Variables de factura preparadas:', { pedidoFactura: this.pedidoFactura, usuarioFactura: this.usuarioFactura });

  
    }

    loading.dismiss();

  }
}
