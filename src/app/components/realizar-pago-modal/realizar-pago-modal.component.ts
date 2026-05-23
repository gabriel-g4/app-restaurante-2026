import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonList, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { SpinnerModalComponent } from '../spinner-modal/spinner-modal.component';
import { DialogService } from 'src/app/services/dialog.service';

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
    private dialogService: DialogService,
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
      this.dialogService.presentToast("Pedido no válido", "danger");
      this.modalController.dismiss();
      return;
    }

    if (typeof this.pedido.precioTotal === 'undefined') {
      console.error('Error: precioTotal no definido en el pedido');
      console.log('Estructura del pedido recibido:', this.pedido);
      this.dialogService.presentToast("Datos del pedido incompletos", "danger");
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
      
      this.dialogService.presentToast("Pago realizado con éxito", "success");
      
      
      await this.modalController.dismiss();
      this.router.navigate(['/home']);
    } catch (error) {
      loading.dismiss();
      console.error('Error al realizar el pago:', error);

      this.dialogService.presentToast("Error al procesar el pago", "danger");

    }
  }

  cerrar() {
    this.modalController.dismiss();
  }

}
