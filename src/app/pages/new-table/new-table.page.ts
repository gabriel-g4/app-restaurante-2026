import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
  IonButtons, IonBackButton, IonIcon, ToastController, ModalController
} from '@ionic/angular/standalone';
import { QRCodeComponent } from 'angularx-qrcode'; //module
import { Camera } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DatabaseService } from 'src/app/services/database.service';
import { camera } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { StorageService } from 'src/app/services/storage.service';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';
import { DialogService } from 'src/app/services/dialog.service';

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
  fotoTomada: string | undefined | null;

  qrDataString: string = '';

  constructor(private fb: FormBuilder, private toastController: ToastController, private databaseService: DatabaseService, private storageService: StorageService, private modalController: ModalController, private dialogService: DialogService) {
    addIcons({ camera })
  }

  ngOnInit() {
    this.mesaForm = this.fb.group({
      numero: ['', [Validators.required, Validators.min(1)]],
      comensales: ['', [Validators.required, Validators.min(1)]],
      tipo: ['', [Validators.required]], // Opciones: 'vip', 'estandar', 'discapacitados'
      foto: [null, [Validators.required]]
    });

    this.mesaForm.valueChanges.subscribe(valores => {
      if (valores.numero && valores.tipo) {
        this.qrDataString = `mesa-${valores.numero}`;
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

    const existe = await this.databaseService.verificarExistenciaMesa(numeroMesa);
    if (existe) { this.mostrarError("La mesa ya existe"); return; }

    console.log('Mesa válida lista para guardar:', this.mesaForm.value);
    console.log('QR Generado con la data:', this.qrDataString);

    const loading = await this.modalController.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });

    loading.present();

    try {
      const mesaData = this.mesaForm.value;
      const exists = await this.databaseService.verificarExistenciaMesa(parseInt(mesaData.numero!, 10));
      if (exists) {
        loading.dismiss();
        this.dialogService.presentToast(`La mesa número ${mesaData.numero} ya existe.`);
        return;
      }

      // const photoURL = await this.storageService.uploadImage(this.fotoTomada!);
      const response = await fetch(this.fotoTomada!);
      const blob = await response.blob();

      const photoURL = await this.storageService.uploadImage(blob);

      const newTable = {
        ...mesaData,
        foto: photoURL,
        estado: 'libre'
      };

      const tableId = await this.databaseService.agregarMesa(newTable);

      loading.dismiss();
      this.dialogService.presentToast('Mesa agregada exitosamente. Se ha generado el código QR.', 'success');

      this.mesaForm.reset();
      this.fotoTomada = null;

    } catch (error) {
      loading.dismiss();
      console.error('Error al agregar la mesa:', error);
      this.dialogService.presentToast('Ocurrió un problema al guardar la mesa.', 'danger');
    }
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