import { Component, OnInit, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton, IonContent, IonHeader, IonInput, IonInputPasswordToggle, IonModal, IonList,
  IonItem, IonAvatar, IonIcon, IonLabel, ModalController, Platform, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DialogService } from 'src/app/services/dialog.service';
import { FirebaseError } from '@angular/fire/app';
import { Router } from '@angular/router';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import { peopleCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, CommonModule,
    FormsModule, ReactiveFormsModule, IonInputPasswordToggle,
    IonButton, IonInput, IonLabel,
    IonModal, IonList, IonItem, IonAvatar, IonIcon
  ],
})
export class LoginPage implements OnInit {
  @ViewChild(IonModal) modalAcceso!: IonModal;
  perfilesPrueba = [
    { nombre: 'Dueño', email: 'duenio@apprestaurante.com', foto: 'https://ui-avatars.com/api/?name=Due%C3%B1o&background=23395B&color=CBF7ED&rounded=true&bold=true' },
    { nombre: 'Supervisor', email: 'supervisor@apprestaurante.com', foto: 'https://ui-avatars.com/api/?name=Supervisor&background=23395B&color=CBF7ED&rounded=true&bold=true' },
    { nombre: 'Mozo', email: 'mozo@apprestaurante.com', foto: 'https://ui-avatars.com/api/?name=Mozo&background=23395B&color=CBF7ED&rounded=true&bold=true' },
    { nombre: 'Cocinero', email: 'cocinero@apprestaurante.com', foto: 'https://ui-avatars.com/api/?name=Cocinero&background=23395B&color=CBF7ED&rounded=true&bold=true' },
    { nombre: 'Cantinero', email: 'cantinero@apprestaurante.com', foto: 'https://ui-avatars.com/api/?name=Cantinero&background=23395B&color=CBF7ED&rounded=true&bold=true' },
    { nombre: 'Maître', email: 'metre@apprestaurante.com', foto: 'https://ui-avatars.com/api/?name=Maitre&background=23395B&color=CBF7ED&rounded=true&bold=true' },
    { nombre: 'Cliente', email: 'cliente@cliente.com', foto: 'https://ui-avatars.com/api/?name=Cliente&background=23395B&color=CBF7ED&rounded=true&bold=true' },
  ];


  constructor(
    private authService: AuthService,
    private databaseService: DatabaseService,
    private dialogService: DialogService,
    private router: Router,
    private modalController: ModalController,
    private pushNotificationService: PushNotificationService,
    private platform: Platform
  ) {
    addIcons({ peopleCircleOutline });
    this.platform.backButton.subscribeWithPriority(10, async (processNextHandler) => {
      if (this.router.url === '/login') {
        const audio = new Audio('/assets/sounds/logout.mp3');
        try {
          await audio.play();
        } catch (e) {
          console.error('Error audio:', e);
        }
        // Pequeña demora para escuchar el sonido antes de matar la app
        setTimeout(() => {
          App.exitApp();
        }, 800);
      } else {
        processNextHandler();
      }
    });
  }

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  ngOnInit() { }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  async IniciarSesion() {
    if (this.loginForm.valid) {
      const loading = await this.modalController.create({
        component: SpinnerModalComponent,
        cssClass: 'spinner-modal',
        backdropDismiss: false
      });

      loading.present();

      try {
        const userCredentials = await this.authService.iniciarSesionConContrasenia(
          this.loginForm.value.email || '',
          this.loginForm.value.password || ''
        );

        console.log('USER CREDENTIALS');
        console.log(userCredentials);

        const uid = userCredentials.user.uid;

        // const user = await this.databaseService.obtenerUsuarioPorId(uid);

        const user = await this.databaseService.obtenerUsuarioPorEmail(
          this.loginForm.value.email || ''
        );

        console.log('USUARIO');
        console.log(user);

        if (user!['estado'] == 'rechazado') {
          throw new Error("Su usuario ha sido rechazado.")
        } else if (user!['estado'] == 'pendiente') {
          throw new Error("Su cuenta está pendiente de aprobación.")
        }

        if (user && user['rol']) {
          this.authService.setRol(user['rol']);
        }

        this.loginForm.reset();

        await this.pushNotificationService.initPush();

        const tokenMobile = this.pushNotificationService.push_token;
        console.log('Token de notificación:', tokenMobile);

        if (tokenMobile) {
          user!['push_token'] = tokenMobile;
          await this.databaseService.modificarUsuario(user, 'usuarios');
        }

        loading.dismiss();
        this.router.navigate(['/home']);
      } catch (error) {
        // ERR INICIO SESION INVALIDO
        loading.dismiss();

        // Vibracion
        await Haptics.impact({ style: ImpactStyle.Heavy })

        if (error instanceof FirebaseError) {
          this.dialogService.presentToast('Credenciales inválidas.', 'danger');
        } else {
          this.dialogService.presentToast(String(error), 'danger');
        }

        console.log(error);
      }
    } else {
      // ERR FORM INVALIDO
      await Haptics.impact({ style: ImpactStyle.Heavy })
      this.dialogService.presentToast(
        'Complete el formulario con correo y contraseña.',
        'warning'
      );
    }
  }

  autoCompleteLogin(mail: string, password: string) {
    this.loginForm.reset();
    this.loginForm.patchValue({
      email: mail,
      password: password
    });
  }

  seleccionarPerfil(perfil: any) {
    this.modalAcceso.dismiss();
    this.autoCompleteLogin(perfil.email, '111111');
  }
}