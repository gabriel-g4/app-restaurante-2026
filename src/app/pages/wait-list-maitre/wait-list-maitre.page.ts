import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuController, AlertController } from '@ionic/angular';
import {
  ToastController, IonContent, IonHeader, IonTitle, IonToolbar,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { menuOutline, logOutOutline, peopleOutline, personCircleOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DatabaseService } from 'src/app/services/database.service';
import { register } from 'swiper/element/bundle';
import { DialogService } from 'src/app/services/dialog.service';
import { MaitreService } from 'src/app/services/maitre.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';
// register Swiper custom elements
register();



interface ClienteEnEspera {
  idPedido: string;
  idDocumento: string;
  idUsuario: string;
  estado: string;
  clienteInfo: {
    nombre: string;
    apellido: string;
  };
  mesaSeleccionada: string | null;
  foto: string;
}

@Component({
  selector: 'app-wait-list-maitre',
  templateUrl: './wait-list-maitre.page.html',
  styleUrls: ['./wait-list-maitre.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonIcon,
    IonCard,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSpinner
  ]
})

export class WaitListMaitrePage implements OnInit, AfterViewInit {

  listaEspera: ClienteEnEspera[] = [];
  mesasDisponibles: any[] = [];
  cargo: boolean = false;

  private mesasSub!: Subscription;
  private clientesSub!: Subscription;
  currentIndex = 0;

  constructor(
    private menuCtrl: MenuController,
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private db: DatabaseService,
    private alertCtrl: AlertController,
    private dialogService: DialogService,
    private maitreService: MaitreService,
    private notificationSender: NotificationSenderService,
    private modalController: ModalController
  ) {
    addIcons({ menuOutline, logOutOutline, peopleOutline, personCircleOutline });
  }

  ngOnInit() {
    this.cargarDatos();
    console.log(this.mesasDisponibles);

    this.maitreService.traerColeccion('mesas').subscribe((response) => {
      this.mesasDisponibles = response;
      console.log(this.mesasDisponibles);
    });
  }

  ngAfterViewInit(): void {
    // const swiperEl = document.querySelector('swiper-container');

    // swiperEl!.addEventListener('slideChange', () => {
    //   this.currentIndex = swiperEl!.swiper.activeIndex;
    // });
  }

  cargarDatos() {
    console.log("🔵 Suscripción a getClientesEnEspera() iniciada");

    this.clientesSub = this.maitreService.getClientesEnEspera().subscribe({
      next: (clientes) => {
        console.log("📥 Datos recibidos en next():", clientes);
        console.log("📊 Cantidad de clientes en espera:", clientes?.length);

        this.listaEspera = clientes;
        this.cargo = true;
        console.log("✅ listaEspera actualizada");
      },
      error: (err) => {
        this.cargo = true;
        console.error("❌ Error en la suscripción getClientesEnEspera:", err);
        this.mostrarError('Error al cargar lista de espera');
        console.log("⚠️ mostrarError() ejecutado");
      }
    });


    console.log("🔚 Fin de la configuración de suscripción");

  }

  getNumeroMesa(docId: string): number {
    const mesa = this.mesasDisponibles.find(m => m.id === docId);
    return mesa ? mesa.idMesa : 0;
  }

  async mostrarSelectorMesas(cliente: ClienteEnEspera, swiper?: any) {

    // Guardar slide actual
    const indexActual = this.currentIndex;

    if (this.mesasDisponibles.length === 0) {
      await this.mostrarError('No hay mesas disponibles');
      return;
    }

    const mesasLibres = this.mesasDisponibles.filter(m => m.estado === 'libre');

    if (mesasLibres.length === 0) {
      await this.mostrarError('No hay mesas libres en este momento');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Seleccionar mesa',
      inputs: mesasLibres.map(mesa => ({
        name: 'mesa',
        type: 'radio',
        label: `Mesa ${mesa.idMesa}`,
        value: mesa.id,
        checked: cliente.mesaSeleccionada === mesa.id
      })),
      cssClass: "mi-alerta",
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceptar',
          handler: (selectedId) => {
            if (selectedId) {
              cliente.mesaSeleccionada = selectedId;
            }
          }
        }
      ]
    });

    await alert.present();
    await alert.onDidDismiss();

    // 🔥 Restaurar slide donde estaba
    const swiperEl: any = document.querySelector('swiper-container');

    // swiperEl.nativeElement.swiper.slideTo(indexActual, 0); 
  }

  async asignarMesa(cliente: ClienteEnEspera) {

    const loading = await this.modalController.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });
    await loading.present();


    if (!cliente.mesaSeleccionada) {
      loading.dismiss();
      await this.mostrarError('Seleccione una mesa primero');
      return;
    }

    try {
      const resultado = await this.maitreService.asignarMesa(
        cliente.idDocumento,
        cliente.mesaSeleccionada,
        cliente.idUsuario
      );

      if (resultado.success) {
        await this.mostrarExito(`Mesa ${resultado.mesaNumero} asignada a ${cliente.clienteInfo.nombre} ${cliente.clienteInfo.apellido} número de pedido ${cliente.idPedido}`);
        console.log("Notificando a usuario ID:", cliente.idUsuario);
        this.notificationSender.enviarNotificacion({
          title: 'Mesa asignada',
          body: `Su mesa es la numero: ${resultado.mesaNumero}, ya se puede ir a sentar`,
          roles: ['cliente'],
          path: 'home',
          collection: 'usuarios'
        });
        this.listaEspera = this.listaEspera.filter(c => c.idDocumento !== cliente.idDocumento);
        loading.dismiss();
      }
    } catch (error: any) {
      loading.dismiss();
      await this.mostrarError(error.message || 'Error al asignar la mesa');
    }





  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'middle',
      color: 'danger'
    });
    await toast.present();
  }

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'middle',
      color: 'success'
    });
    await toast.present();
  }


  ngOnDestroy() {
    this.mesasSub?.unsubscribe();
    this.clientesSub?.unsubscribe();
  }




}