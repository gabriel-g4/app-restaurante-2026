import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
  IonButtons, IonBackButton, IonIcon, ToastController
} from '@ionic/angular/standalone';
import { QRCodeComponent } from 'angularx-qrcode'; //module
import { Camera } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-new-table',
  templateUrl: './new-table.page.html',
  styleUrls: ['./new-table.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, ReactiveFormsModule, IonButtons,
    IonBackButton, IonIcon, QRCodeComponent
  ]
})
export class NewTablePage implements OnInit {

  mesaForm!: FormGroup;
  fotoTomada: string | undefined;

  qrDataString: string = '';

  constructor(private fb: FormBuilder, private toastController: ToastController) { }

  ngOnInit() {
    this.mesaForm = this.fb.group({
      numero: ['', [Validators.required, Validators.min(1)]],
      comensales: ['', [Validators.required, Validators.min(1)]],
      tipo: ['', [Validators.required]], // Opciones: 'vip', 'estandar', 'discapacitados'
      foto: [null, [Validators.required]]
    });

    this.mesaForm.valueChanges.subscribe(valores => {
      if (valores.numero && valores.tipo) {
        this.qrDataString = `MESA-${valores.numero}-${valores.tipo}`;
      } else {
        this.qrDataString = '';
      }
    });
  }

  async tomarFoto() {
    try {
      const image = await Camera.takePhoto({
        quality: 90,
        editable: "no"
      });

      this.fotoTomada = image.uri || image.webPath;

      this.mesaForm.patchValue({ foto: this.fotoTomada });

    } catch (error) {
      console.log('Error o cancelación al tomar foto', error);
    }
  }

  async registrarMesa() {
    if (this.mesaForm.invalid) {
      this.mesaForm.markAllAsTouched();
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.mostrarError('Revisá los campos marcados del formulario.');
      return;
    }

    const numeroMesa = this.mesaForm.get('numero')?.value;

    // const existe = await this.databaseService.verificarMesaExistente(numeroMesa);
    // if (existe) { mostrarError("La mesa ya existe"); return; }

    console.log('Mesa válida lista para guardar:', this.mesaForm.value);
    console.log('QR Generado con la data:', this.qrDataString);
  }

  async mostrarError(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }
}