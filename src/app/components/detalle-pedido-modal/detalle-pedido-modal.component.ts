import { Component, Input} from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { closeOutline, cartOutline } from 'ionicons/icons';

import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
  IonLabel, IonButton, IonButtons, IonIcon, IonText,  
  IonSpinner
} from '@ionic/angular/standalone';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { DialogService } from 'src/app/services/dialog.service';



@Component({
  selector: 'app-detalle-pedido-modal',
  templateUrl: './detalle-pedido-modal.component.html',
  styleUrls: ['./detalle-pedido-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonButtons, IonIcon, IonText, 
    IonSpinner
  ]
})
export class DetallePedidoModalComponent {
  @Input() carrito: any[] = [];
  @Input() idPedido: string = '';
  @Input() estadoAnterior: string = '';
  tiempoEstimado: number = 0;
  precioTotal: number = 0;
  cargando: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private pedidoService: PedidoService,
    private router: Router,
    private notificationSenderService: NotificationSenderService,
    private dialogService: DialogService
  ) {
    addIcons({ closeOutline, cartOutline });
  }

  ionViewWillEnter() {
    this.calcularTotales();
  }

  calcularTotales() {
    this.precioTotal = this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    this.tiempoEstimado = Math.max(...this.carrito.map(item => item.tiempo), 0);
  }

  async ordenarPedido() {
    this.cargando = true;
    try {
      const pedidoData = {
        productos: this.carrito,
        precioTotal: this.precioTotal,
        tiempoEstimado: this.tiempoEstimado
      };

        if (this.estadoAnterior === 'rechazado' && this.idPedido) {
          await this.pedidoService.crearPedido(pedidoData);
        } else {
          this.idPedido = await this.pedidoService.crearPedido(pedidoData);
        }

        

        this.notificationSenderService.enviarNotificacion({
              title: 'Nuevo pedido',
              body: `Hay un nuevo pedido pendiente.`,
              roles: ['mozo'],
              path: 'home',
              collection: 'usuarios',
            });
        

      this.dialogService.presentToast("Pedido realizado con éxito", "success");

      this.modalCtrl.dismiss({ ordenRealizada: true });
      this.router.navigate(['/menu-principal']);
    } catch (error) {
      console.error('Error al ordenar pedido:', error);
      this.dialogService.presentToast("Error al realizar el pedido", "danger");
    } finally {
      this.cargando = false;
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
