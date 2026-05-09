import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { ToastController, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, IonButton } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { checkmark, checkmarkCircleOutline, close } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { register } from 'swiper/element/bundle';
import { EmailService } from 'src/app/services/email.service';
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
    private toastCtrl: ToastController,
    private email: EmailService
  ) { 
    addIcons({ checkmark, close, checkmarkCircleOutline})
    //https://i.imgur.com/Mlwfs3F.png
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
      await this.mailRechazado(cliente);
      this.mostrarToast(`El cliente ${cliente.nombre} ha sido rechazado.`, 'warning');
    } catch (error) {
      this.mostrarToast('Hubo un error al rechazar al cliente.', 'danger');
    }
  }

  async confirmarAceptacion(cliente: any) {
    await Haptics.impact({ style: ImpactStyle.Light });

    try {
      await this.dbService.aceptarCliente(cliente.id);
      await this.mailAceptado(cliente);
      this.mostrarToast(`El cliente ${cliente.nombre} ha sido aceptado.`, 'success');
    } catch (error) {
      this.mostrarToast('Hubo un error al aceptar al cliente.', 'danger');
    }
  }

  private async mailAceptado(client: any){
    await this.email.enviarCorreo({
      nombre: client.nombre,
      estado: 'Estado de tu cuenta: Aprobado',
      mensaje: 'Tu cuenta ha sido aprobada y ya podés usar nuestra aplicación. Ahora podés hacer pedidos, ver el menú actualizado y acceder a todas las funciones disponibles. ¡Gracias por elegirnos!',
      email: client.email,
      foto_portada: 'https://i.imgur.com/Mlwfs3F.png',
      foto: 'https://i.imgur.com/uvNuOdQ.png',
      color_portada: 'lightgreen',
      fuente: 'Verdana',
      size_mensaje: 16
    }, "template_pipcjju")
  }

  private async mailRechazado(client: any){
    await this.email.enviarCorreo({
      nombre: client.nombre,
      estado: 'Estado de tu cuenta: Rechazado',
      mensaje: 'Lamentamos informarte que no pudimos aprobar tu registro en la aplicación del restaurante. Gracias por tu comprensión.',
      email: client.email,
      foto_portada: 'https://i.imgur.com/Mlwfs3F.png',
      foto: 'https://i.imgur.com/BlAOKKN.png',
      color_portada: 'indianred',
      fuente: 'Verdana',
      size_mensaje: 16
    }, "template_pipcjju")
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