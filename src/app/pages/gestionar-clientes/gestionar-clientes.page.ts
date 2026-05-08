import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { ToastController, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, IonButton } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { checkmark, checkmarkCircleOutline, close } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { register } from 'swiper/element/bundle';
// register Swiper custom elements
register();

@Component({
  selector: 'app-gestionar-clientes',
  templateUrl: './gestionar-clientes.page.html',
  styleUrls: ['./gestionar-clientes.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonButton, IonIcon, IonContent, IonBackButton, IonButtons,
    IonHeader, IonToolbar, IonTitle
  ]
})
export class GestionarClientesPage implements OnInit {
  clientesPendientes: any[] = [];

  constructor(
    private dbService: DatabaseService,
    private toastCtrl: ToastController
  ) { 
    addIcons({ checkmark, close, checkmarkCircleOutline})
  }

  ngOnInit() {
    this.dbService.obtenerClientesPendientes().subscribe(clientes => {
      this.clientesPendientes = clientes;
    });
  }

  async confirmarRechazo(cliente: any) {
    await Haptics.impact({ style: ImpactStyle.Heavy });

    try {
      await this.dbService.rechazarCliente(cliente.id);
      this.mostrarToast(`El cliente ${cliente.nombre} ha sido rechazado.`, 'warning');
    } catch (error) {
      this.mostrarToast('Hubo un error al rechazar al cliente.', 'danger');
    }
  }

  async confirmarAceptacion(cliente: any) {
    await Haptics.impact({ style: ImpactStyle.Light });

    try {
      await this.dbService.aceptarCliente(cliente.id);
      this.mostrarToast(`El cliente ${cliente.nombre} ha sido aceptado.`, 'success');
    } catch (error) {
      this.mostrarToast('Hubo un error al aceptar al cliente.', 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'middle'
    });
    await toast.present();
  }
}