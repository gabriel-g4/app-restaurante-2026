import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, camera, qrCodeOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

import { Camera } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-new-employee',
  templateUrl: './new-employee.page.html',
  styleUrls: ['./new-employee.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonButtons, IonButton, IonBackButton, IonIcon, ReactiveFormsModule
  ]
})
export class NewEmployeePage implements OnInit {

  empleadoForm!: FormGroup;
  fotoTomada: string | undefined;

  constructor(private router: Router, private dialogService: DialogService, private fb: FormBuilder, private toastController: ToastController) {
    addIcons({ qrCodeOutline, camera, cameraOutline });
  }

  ngOnInit() {
    this.inicializarFormulario();
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
      perfil: ['cocinero', [Validators.required]], // Cocinero por defecto
      foto: [null, [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(group: FormGroup) {
    const pass = group.get('clave')?.value;
    const repeatPass = group.get('repetirClave')?.value;
    return pass === repeatPass ? null : { notMatching: true };
  }

  async tomarFoto() {
    try {
      const image = await Camera.takePhoto({
        quality: 90,
        editable: "no",
      });

      this.fotoTomada = image.uri || image.webPath;

      this.empleadoForm.patchValue({ foto: this.fotoTomada });

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

    // Cálculo del Módulo 11
    let resto = suma % 11;
    let digitoVerificador = 11 - resto;

    // Reglas especiales de AFIP para el dígito verificador
    if (digitoVerificador === 11) {
      digitoVerificador = 0;
    } else if (digitoVerificador === 10) {
      // Si el verificador da 10, hay conflicto registral. AFIP cambia el prefijo a 23.
      prefijo = '23';
      digitoVerificador = sexo === 'M' ? 9 : 4;
    }

    return prefijo + dniStr + digitoVerificador;
  }

  async registrar() {
    if (this.empleadoForm.invalid) {
      this.empleadoForm.markAllAsTouched();

      await Haptics.impact({ style: ImpactStyle.Heavy })
      this.dialogService.presentToast(
        'Complete todos los campos.',
        'warning'
      );

      return;
    }

    console.log('¡Formulario válido! Datos listos para Firebase:', this.empleadoForm.value);

    // this.firebaseService.guardarEmpleado(this.empleadoForm.value);
  }
}