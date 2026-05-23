import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonInput, IonHeader, IonTitle, IonToolbar, IonSelect, IonButtons, IonButton, IonBackButton, IonIcon, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, camera, qrCodeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';

import { Camera } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { DialogService } from 'src/app/services/dialog.service';

import { DatabaseService } from 'src/app/services/database.service';
import { StorageService } from 'src/app/services/storage.service';
import { AuthService } from 'src/app/services/auth.service';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';

@Component({
  selector: 'app-new-employee',
  templateUrl: './new-employee.page.html',
  styleUrls: ['./new-employee.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonButtons, IonButton, IonBackButton, IonIcon, ReactiveFormsModule,
    IonInput, IonSelect, IonSelectOption
  ]
})
export class NewEmployeePage implements OnInit {

  empleadoForm!: FormGroup;
  emailAdminActual: string = '';
  selectedFile: File | null = null;
  imagenPreview: string | null = null;

  constructor(
    private router: Router,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private modalController: ModalController,
    private db: DatabaseService,
    private storage: StorageService,
    private auth: AuthService
  ) {
    addIcons({ qrCodeOutline, camera, cameraOutline });
  }

  ngOnInit() {
    this.inicializarFormulario();
    this.auth.usuario$.subscribe(user => {
      if (user && user.email) {
        this.emailAdminActual = user.email;
      }
    });
  }

  inicializarFormulario() {
    this.empleadoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}$')]],
      cuil: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
      correo: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      repetirClave: ['', [Validators.required]],
      perfil: ['cocinero', [Validators.required]], // Puede ser dueño, supervisor, mozo, etc.
      foto: [null, [Validators.required]] // Este control es solo para validación visual
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(group: FormGroup) {
    const pass = group.get('clave')?.value;
    const repeatPass = group.get('repetirClave')?.value;
    return pass === repeatPass ? null : { notMatching: true };
  }

  // --- OBTENCIÓN DE FOTO ADAPTADA AL STORAGE ---
  async tomarFoto() {
    try {
      const image = await Camera.takePhoto({
        quality: 80,
        editable: "no",
      });

      // Lógica de register.ts para preparar el archivo a subir a Storage
      const response = await fetch(image.webPath!);
      const blob = await response.blob();
      this.selectedFile = new File([blob], image.uri || image.webPath || "empleado.jpg", { type: blob.type });
      this.imagenPreview = URL.createObjectURL(blob);

      // Actualizamos el form solo para que pase la validación
      this.empleadoForm.patchValue({ foto: this.imagenPreview });

    } catch (error) {
      console.log('El usuario canceló la foto o hubo un error', error);
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
        const qrData = barcodes[0].rawValue;
        this.procesarDatosDNI(qrData!);
      }
    } catch (error) {
      console.error('Error al intentar escanear el DNI', error);
    }
  }

  procesarDatosDNI(qrData: string) {
    const partes = qrData.split('@');

    if (partes.length >= 8) {
      const apellidoLeido = partes[1];
      const nombreLeido = partes[2];
      const sexoLeido = partes[3];
      const dniLeido = partes[4];

      const cuilCalculado = this.generarCuil(dniLeido, sexoLeido);

      this.empleadoForm.patchValue({
        nombre: nombreLeido,
        apellido: apellidoLeido,
        dni: dniLeido,
        cuil: cuilCalculado
      });
    }
  }

  // --- ALGORITMO MATEMÁTICO: GENERADOR DE CUIL ---
  generarCuil(dni: string, sexo: string): string {
    if (!dni || !sexo) return '';

    const dniStr = dni.padStart(8, '0');
    let prefijo = sexo === 'M' ? '20' : (sexo === 'F' ? '27' : '23');

    const cuilBase = prefijo + dniStr;
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += parseInt(cuilBase.charAt(i)) * multiplicadores[i];
    }

    let resto = suma % 11;
    let digitoVerificador = 11 - resto;

    if (digitoVerificador === 11) {
      digitoVerificador = 0;
    } else if (digitoVerificador === 10) {
      prefijo = '23';
      digitoVerificador = sexo === 'M' ? 9 : 4;
    }

    return prefijo + dniStr + digitoVerificador;
  }

  // --- PROCESO DE REGISTRO INTEGRADO ---
  async registrar() {
    if (this.empleadoForm.valid && this.selectedFile) {

      const { nombre, apellido, dni, cuil, correo, clave, perfil } = this.empleadoForm.value;

      const emailAdminBackup = this.emailAdminActual;
      const claveAdminBackup = '111111';

      const loading = await this.modalController.create({
        component: SpinnerModalComponent,
        cssClass: 'spinner-modal',
        backdropDismiss: false
      });
      await loading.present();

      try {
        // 1. Subir imagen a Storage
        const urlFoto = await this.storage.uploadImage(this.selectedFile);

        // 2. Crear el usuario en Firebase Authentication
        const userCredential = await this.auth.register(correo, clave);
        const userId = userCredential.user?.uid;

        if (userId && urlFoto) {
          // 3. Guardar datos en Firestore (colección 'usuarios')
          const nuevoEmpleado = {
            id: userId,
            nombre: nombre,
            apellido: apellido,
            dni: dni,
            cuil: cuil,
            email: correo.toLowerCase(),
            rol: perfil,
            foto: urlFoto,
            estado: 'aceptado',
          };

          await this.db.agregarUsuario(nuevoEmpleado, 'usuarios');
          await this.auth.cerrarSesion();
          await this.auth.iniciarSesionConContrasenia(emailAdminBackup, claveAdminBackup);
        }

        // 4. Finalizar proceso
        loading.dismiss();
        this.empleadoForm.reset();
        this.selectedFile = null;
        this.imagenPreview = null;

        await this.dialogService.presentToast('Empleado registrado exitosamente.', 'success');
        this.router.navigate(['/home']);

      } catch (error: any) {
        loading.dismiss();
        await Haptics.impact({ style: ImpactStyle.Heavy });

        // MANEJO DE ERRORES ESPECÍFICOS DE FIREBASE AUTH
        if (error.code === 'auth/invalid-email') {
          await this.dialogService.presentToast('El correo electrónico tiene un formato inválido.', 'danger');
        } else if (error.code === 'auth/email-already-in-use') {
          await this.dialogService.presentToast('Este correo ya está registrado en el sistema.', 'danger');
        } else {
          await this.dialogService.presentToast('Error al registrar el empleado.', 'danger');
        }
      }

    } else {
      // Formulario inválido o falta foto
      this.empleadoForm.markAllAsTouched();
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.dialogService.presentToast('Complete todos los campos y tome una foto.', 'warning');
    }
  }
}