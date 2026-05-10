import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  Platform,
  IonCheckbox,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { qrCodeOutline, camera } from 'ionicons/icons';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { ScannerService } from 'src/app/services/scanner.service';
import { DniData } from 'src/app/services/scanner.service';
import { Camera } from '@capacitor/camera';
import { DialogService } from 'src/app/services/dialog.service';
import { soloLetras, soloNumeros } from 'src/utils/helpers';
import { DatabaseService } from 'src/app/services/database.service';
import { StorageService } from 'src/app/services/storage.service';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationSenderService } from 'src/app/services/notification-sender.service';
import { Client } from 'src/app/classes/client';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';


export const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pass = group.get('password')?.value;
  const repeat = group.get('repeatPassword')?.value;
  return pass === repeat ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonIcon,
    IonCheckbox,
    IonLabel,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})

export class RegisterPage implements OnInit {

  formularioAlta = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    dni: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    repeatPassword: new FormControl('', [Validators.required]),
    esAnonimo: new FormControl(false),
    push_token: new FormControl('')
  }, { validators: passwordsMatchValidator });

  soloLetras = soloLetras;
  soloNumeros = soloNumeros;
  qrCode: string = '';
  parsedDniData: DniData | null = null;
  selectedFile: File | null = null;
  imagenPreview: string | null = null;

  constructor(
    private router: Router,
    private dialogService: DialogService,
    private platform: Platform,
    private scannerService: ScannerService,
    private db: DatabaseService,
    private storage: StorageService,
    private auth: AuthService,
    private notificationSenderService: NotificationSenderService,
    private modalController: ModalController
  ) {
    addIcons({
      qrCodeOutline,
      camera
    })
  }

  ngOnInit() {
    if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
  }

  generarEmailRandom() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);

    const hash = Array.from(array, n => chars[n % chars.length]).join('');
    return hash + '@mail.com';
  }

  async handleRegister() {
    if (this.formularioAlta.valid && this.selectedFile) {
      const { nombre, email, password, esAnonimo } = this.formularioAlta.value;

      

      if (
        typeof nombre === 'string' &&
        typeof email === 'string' &&
        typeof password === 'string' &&
        typeof esAnonimo === 'boolean'
      ) {
        const loading = await this.modalController.create({
          component: SpinnerModalComponent,
          cssClass: 'spinner-modal',
          backdropDismiss: false
        });

        loading.present();
        try {

          const url = await this.storage.uploadImage(this.selectedFile);
          console.log("email:", esAnonimo ? this.generarEmailRandom() : email)
          console.log("pass:", esAnonimo ? '111111' : password)
          const userCredential = await this.auth.register(esAnonimo ? this.generarEmailRandom() : email,
            esAnonimo ? '111111' : password);
          const userId = userCredential.user?.uid;

          if (userId && url) {
            const client: Client = new Client(
              userId,
              nombre,
              esAnonimo ? '' : (this.formularioAlta.get('apellido')?.value || ''),
              esAnonimo ? '' : (this.formularioAlta.get('dni')?.value || ''),
              email,
              url,
              esAnonimo ? 'aceptado' : 'pendiente',
              'cliente', // Rol fijo como 'cliente'
              '',
              esAnonimo
            );

            await this.db.agregarUsuario(client, 'usuarios');

            if (!esAnonimo) {
              this.notificationSenderService.enviarNotificacion({
                title: 'Nuevo Cliente Registrado',
                body: `Cliente: ${nombre} ${this.formularioAlta.get('apellido')?.value} esperando aceptación.`,
                roles: ['dueño', 'supervisor'],
                path: 'gestionar-clientes',
                collection: 'usuarios',
              });
            }
          }

          loading.dismiss();

          this.formularioAlta.reset()
          this.selectedFile = null;
          this.imagenPreview = null;

          if (esAnonimo) {
            this.router.navigate(['/home'])
          } else {
            await this.dialogService.presentToast(
              'Cliente registrado con éxito. Pendiente de aprobación.'
            );
          }

        } catch (error) {
          loading.dismiss();
          await this.dialogService.presentToast(
            'Error al registrarse. Por favor, intenta de nuevo.'
          );
        }
      }
    }
  }

  async escanearQR() {
  
      try {
        const { camera } = await BarcodeScanner.requestPermissions();
        if (camera !== 'granted' && camera !== 'limited') {
          console.error('Permiso de cámara denegado para el escáner');
          return;
        }
  
        const { barcodes } = await BarcodeScanner.scan();
  
        if (barcodes.length > 0) {
          this.qrCode = barcodes[0].rawValue || "";
          this.onScanQrCode();
        }
      } catch (error) {
        console.error('Error al intentar escanear el DNI', error);
      }
    }
  

  onScanQrCode() {
    const qrString = this.qrCode;
    this.parsedDniData = this.scannerService.parseDniQrCode(qrString);

    if (this.parsedDniData) {
      this.formularioAlta.patchValue({
        nombre: this.parsedDniData.nombre,
        apellido: this.parsedDniData.apellido,
        dni: this.parsedDniData.numeroDeDni,
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  toggleAnonimo() {
    const esAnonimo = this.formularioAlta.get('esAnonimo')?.value;

    if (esAnonimo) {
      this.formularioAlta.get('apellido')?.setValue('');
      this.formularioAlta.get('dni')?.setValue('');
      this.formularioAlta.get('email')?.setValue('');
      this.formularioAlta.get('password')?.setValue('');
      this.formularioAlta.get('repeatPassword')?.setValue('');

      this.formularioAlta.get('apellido')?.removeValidators([Validators.required])
      this.formularioAlta.get('dni')?.removeValidators([Validators.required, Validators.pattern('^[0-9]*$')])
      this.formularioAlta.get('email')?.removeValidators([Validators.required, Validators.email])
      this.formularioAlta.get('password')?.removeValidators([Validators.required])
      this.formularioAlta.get('repeatPassword')?.removeValidators([Validators.required])

    } else {
      this.formularioAlta.get('apellido')?.addValidators([Validators.required])
      this.formularioAlta.get('dni')?.addValidators([Validators.required, Validators.pattern('^[0-9]*$')])
      this.formularioAlta.get('email')?.addValidators([Validators.required, Validators.email])
      this.formularioAlta.get('password')?.addValidators([Validators.required])
      this.formularioAlta.get('repeatPassword')?.addValidators([Validators.required])
    }

    this.formularioAlta.get('apellido')?.updateValueAndValidity()
    this.formularioAlta.get('dni')?.updateValueAndValidity()
    this.formularioAlta.get('email')?.updateValueAndValidity()
    this.formularioAlta.get('password')?.updateValueAndValidity()
    this.formularioAlta.get('repeatPassword')?.updateValueAndValidity()

    console.log(this.formularioAlta)
  }

  async tomarFoto() {
    const image = await Camera.takePhoto({
      quality: 80,
      editable: 'no'
    });

    // image.path / image.webPath tiene la ruta local
    const response = await fetch(image.webPath!); // trae la imagen como blob
    const blob = await response.blob();
    this.selectedFile = new File([blob], image.uri || image.webPath || "imagen.jpg", { type: blob.type });
    this.imagenPreview = URL.createObjectURL(blob);
  }
}
