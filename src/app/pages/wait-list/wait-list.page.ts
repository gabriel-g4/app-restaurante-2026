import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../../services/database.service';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,IonIcon, ModalController  } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, hourglassOutline, statsChartOutline, logOutOutline } from 'ionicons/icons';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { AuthService } from 'src/app/services/auth.service';
import { RespuestaEncuestaModal } from 'src/app/components/respuesta-encuesta/respuesta-encuesta.modal';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-wait-list',
  templateUrl: './wait-list.page.html',
  styleUrls: ['./wait-list.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonContent, IonHeader, IonTitle, IonToolbar,IonIcon],
  providers: [ModalController]
})
export class WaitListPage {

 
  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private modalCtrl: ModalController,
    private notificationSenderService: NotificationSenderService,
    private authService: AuthService,
    private dialogService: DialogService
  ) {
      addIcons({ arrowBackOutline, hourglassOutline, statsChartOutline, logOutOutline });

  }

    async entrarListaEspera(): Promise<void> {
    const loading = await this.modalCtrl.create({
            component: SpinnerModalComponent,
            cssClass: 'spinner-modal',
            backdropDismiss: false
          });
    await loading.present();

    try {
      const userAuth = this.authService.getCurrentUser();
      const userDb = await this.databaseService.obtenerUsuarioPorId(userAuth.uid);
      if (!userAuth) {
        await loading.dismiss();
        this.dialogService.presentToast('Usuario no autenticado. Vuelva a intentar');
        return;
      }

      const puedePedir = await this.databaseService.puedeHacerNuevoPedido(userAuth.uid);
      
      if (!puedePedir) {
        await loading.dismiss();
        this.dialogService.presentToast('Usted ya tiene un pedido en orden.', "warning", 5000);
        return;
      }

      const pedidoData = {
        idPedido: await this.databaseService.generarIdSecuencial('pedidos'),
        idUsuario: userAuth.uid,
        estado: 'esperando mesa',
        fecha: new Date().toISOString(),
        emailUsuario: userAuth.email || '',
        descuento: 0,
        jugo: false
      };

      await this.databaseService.agregarLog(pedidoData, 'pedidos');
      await loading.dismiss();
      this.dialogService.presentToast('Ya está en lista de espera, dentro de poco se le asigna una mesa.', "success" , 5000)
      this.notificationSenderService.enviarNotificacion({
              title: 'Cliente en lista de espera',
              body: `El cliente: ${userDb.nombre} ${userDb.apellido || ''} esta esperando una mesa.`,
              roles: ['metre'],
              path: 'wait-list-maitre',
              collection: 'usuarios',
            });

    } catch (error) {
      await loading.dismiss();
      this.dialogService.presentToast('Error al procesar la solicitud');
      console.error(error);
    }
    
  }
   


  volverAHome(): void {
    this.router.navigate(['/home']);
  }

  async verEncuesta() {
    // Abrir el modal con las encuestas encontradas
    const modal = await this.modalCtrl.create({
      component: RespuestaEncuestaModal,
      componentProps: {
      },
      cssClass: 'encuesta-modal-custom'
    });

    await modal.present();
  }
}