import { Component, OnInit, ViewChild, NgZone } from '@angular/core'; // <-- Importamos NgZone
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonFooter, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons,
    IonBackButton, IonTitle, IonFooter, IonIcon,
    ReactiveFormsModule, FormsModule, DatePipe, TitleCasePipe
  ]
})
export class ChatPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  mensajes: any[] = [];
  chatForm: FormGroup;
  usuarioActual: any = { id: '', rol: '', nombre: '' };
  mesaActualId: string = 'MESA-1';

  constructor(
    private dbService: DatabaseService,
    private authService: AuthService,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private toastCtrl: ToastController,
    private notificationSenderService: NotificationSenderService
  ) {
    addIcons({ send });

    this.chatForm = this.fb.group({
      texto: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  async ngOnInit() {
    this.authService.usuario$.subscribe(async usuarioAuth => {
      if (usuarioAuth) {

        this.usuarioActual.id = usuarioAuth.uid;
        this.usuarioActual.rol = this.authService.getRol();

        const userDoc = await this.dbService.obtenerUsuarioPorId(this.usuarioActual.id)
        if (userDoc) {
          this.usuarioActual.nombre = userDoc.nombre + (userDoc.apellido ? ' ' + userDoc.apellido : '');
        }

        this.dbService.obtenerMensajesMesa(this.mesaActualId).subscribe({
          next: (msgs) => {
            this.ngZone.run(() => {
              this.mensajes = msgs;

              setTimeout(() => {
                if (this.content) {
                  this.content.scrollToBottom(300);
                }
              }, 150);
            });
          },
          error: async (err) => {
            console.error("❌ ERROR CRÍTICO DE FIREBASE:", err);
            await Haptics.impact({ style: ImpactStyle.Heavy });
          }
        });

      }
    });
  }

  formatearMesa(codigoMesa: string): string {
    if (!codigoMesa) return 'Mesa';
    return codigoMesa.replace('-', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  async enviarMensaje() {
    if (this.chatForm.invalid) return;

    const textoMensaje = this.chatForm.get('texto')?.value;
    const rolEmisor = this.usuarioActual.rol;
    const nombreMesaFormateada = this.formatearMesa(this.mesaActualId);

    try {
      this.chatForm.reset();

      await this.dbService.enviarMensajeChat(
        this.usuarioActual.id,
        rolEmisor,
        textoMensaje,
        this.mesaActualId,
        this.usuarioActual.nombre
      );

      if (rolEmisor === 'cliente') {
        await this.notificationSenderService.enviarNotificacion({
          title: 'Nuevo Mensaje de ' + nombreMesaFormateada,
          body: textoMensaje,
          roles: ['mozo'],
          path: 'chat',
          collection: 'usuarios'
        });
      }
      else if (rolEmisor === 'mozo') {
        await this.notificationSenderService.enviarNotificacion({
          title: 'Nuevo Mensaje de Mozo: ' + this.usuarioActual.nombre,
          body: textoMensaje,
          roles: ['cliente'],
          path: 'chat',
          collection: 'usuarios'
        });
      }
    } catch (error) {
      console.error("Error al enviar", error);
      this.mostrarError("No se pudo enviar el mensaje");
    }
  }

  async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 5000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }
}