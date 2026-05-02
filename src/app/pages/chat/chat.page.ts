import { Component, OnInit, ViewChild, NgZone } from '@angular/core'; // <-- Importamos NgZone
import { DatabaseService } from 'src/app/services/database.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonFooter, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  usuarioActual: any;
  mesaActualId: string = 'MESA-1';

  constructor(
    private dbService: DatabaseService,
    private authService: AuthService,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private toastCtrl: ToastController
  ) {
    addIcons({ send });

    this.chatForm = this.fb.group({
      texto: ['', [Validators.required, Validators.maxLength(150)]]
    });
  }

  ngOnInit() {
    this.authService.usuario$.subscribe(usuarioAuth => {
      if (usuarioAuth) {

        this.usuarioActual = {
          id: usuarioAuth.uid,
          perfil: this.authService.getRol()
        };

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
            this.mostrarError("Falta índice Firebase. Mirá la consola (chrome://inspect).");
          }
        });

      }
    });
  }

  async enviarMensaje() {
    if (this.chatForm.invalid) return;

    const textoMensaje = this.chatForm.get('texto')?.value;

    try {
      this.chatForm.reset();

      await this.dbService.enviarMensajeChat(
        this.usuarioActual.id,
        this.usuarioActual.perfil,
        textoMensaje,
        this.mesaActualId
      );
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