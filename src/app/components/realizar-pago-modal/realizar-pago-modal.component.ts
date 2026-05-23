import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonList, IonItem, IonLabel, IonText, ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { SpinnerModalComponent } from '../spinner-modal/spinner-modal.component';

@Component({
  selector: 'app-realizar-pago-modal',
  templateUrl: './realizar-pago-modal.component.html',
  styleUrls: ['./realizar-pago-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonIcon, IonContent, IonList, IonItem, IonLabel, IonText,
    CommonModule
  ]
})
export class RealizarPagoModalComponent  implements OnInit {
  @Input() pedido: any;
  @Input() porcentajePropina: number = 0;
  precioFinal: number = 0;
  propinaCalculada: number = 0;
  isLoading: boolean = false;

  constructor(
    private modalController: ModalController,
    private pedidoService: PedidoService,
    private router: Router,
    private toastCtrl: ToastController,
    private notificationSenderService: NotificationSenderService
  ) {
    addIcons({ closeOutline });
  }

    ngOnInit() {
    this.validarDatosPedido();
    this.calcularPrecioFinal();
  }
private validarDatosPedido() {
    if (!this.pedido) {
      console.error('Error: Pedido no definido');
      this.mostrarError('Pedido no válido');
      this.modalController.dismiss();
      return;
    }

    if (typeof this.pedido.precioTotal === 'undefined') {
      console.error('Error: precioTotal no definido en el pedido');
      console.log('Estructura del pedido recibido:', this.pedido);
      this.mostrarError('Datos del pedido incompletos');
      this.modalController.dismiss();
    }
  }

  private calcularPrecioFinal() {
    try {
      if (!this.pedido || typeof this.pedido.precioTotal !== 'number') {
        throw new Error('Datos del pedido inválidos');
      }

      const descuento = this.pedido.descuento ?? 0;
      

      // Subtotal con descuento
      const subtotalConDescuento = this.pedido.precioTotal * (1 - descuento / 100);

      // Propina sobre subtotal con descuento
      this.propinaCalculada = subtotalConDescuento * (this.porcentajePropina / 100);

      // Precio final
      this.precioFinal = subtotalConDescuento + this.propinaCalculada;

      console.log('Cálculos realizados:', {
        subtotal: this.pedido.precioTotal,
        porcentajePropina: this.porcentajePropina,
        propina: this.propinaCalculada,
        total: this.precioFinal
      });
    } catch (error) {
      console.error('Error en cálculo:', error);
      this.precioFinal = 0;
      this.propinaCalculada = 0;
    }
  }

  getMensajePropina(): string {
    switch(this.porcentajePropina) {
      case 20: return 'Excelente!';
      case 15: return 'Muy bueno!';
      case 10: return 'Bueno';
      case 5: return 'Regular';
      case 0: return 'Mala';
      default: return '';
    }
  }

  getClaseEvaluacion(): string {
    switch(this.porcentajePropina) {
      case 20: return 'excelente';
      case 15: return 'muy-bueno';
      case 10: return 'bueno';
      case 5: return 'regular';
      case 0: return 'mala';
      default: return '';
    }
  }

  async pagar() {
    const loading = await this.modalController.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });

    loading.present();
    try {
      // Actualizamos el pedido con la propina y precio final
      const pedidoActualizado = {
        ...this.pedido,
        porcentajePropina: this.porcentajePropina,
        precioFinal: this.precioFinal,
        estado: 'pagado'
      };

      await this.pedidoService.actualizarPedidoCompleto(
        this.pedido.id, 
        pedidoActualizado
      );

      this.notificationSenderService.enviarNotificacion({
              title: 'Confirmar pago',
              body: `Mesa ${this.pedido.idMesa} quiere pagar.`,
              roles: ['mozo', 'dueño', 'supervisor'],
              path: 'home',
              collection: 'usuarios',
            });
      
      loading.dismiss();
      
      const toast = await this.toastCtrl.create({
        message: 'Pago realizado con éxito',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
      await this.modalController.dismiss();
      this.router.navigate(['/home']);
    } catch (error) {
      loading.dismiss();
      console.error('Error al realizar el pago:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al procesar el pago',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  cerrar() {
    this.modalController.dismiss();
  }

    private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
