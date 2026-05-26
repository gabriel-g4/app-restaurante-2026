

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  ModalController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, camera } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DialogService } from 'src/app/services/dialog.service';
import { soloLetras, soloNumeros } from 'src/utils/helpers';
import { StorageService } from 'src/app/services/storage.service';
import { DatabaseService } from 'src/app/services/database.service';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';

interface Imagen {
  file: File | null;
  preview: string | null;
}


@Component({
  selector: 'app-new-dish',
  templateUrl: './new-dish.page.html',
  styleUrls: ['./new-dish.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons,
    IonBackButton,
    IonIcon,
    ReactiveFormsModule,
  ]
})
export class NewDishPage implements OnInit {

  tiposPlato = ['postre', 'comida']
  soloNumeros = soloNumeros;
  soloLetras = soloLetras;
  selectedFile: File | null = null;
  imagenPreview: string | null = null;
  imagenes: Imagen[] = [
    { file: null, preview: null },
    { file: null, preview: null },
    { file: null, preview: null },
  ];

  formularioPlato = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    descripcion: new FormControl('', [Validators.required]),
    tiempo: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    precio: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    tipo: new FormControl('', [Validators.required]),
    push_token: new FormControl('')
  });


  constructor(
    private dialogService: DialogService,
    private modalController: ModalController,
    private storage: StorageService,
    private db: DatabaseService,
  ) {
    addIcons({
      qrCodeOutline,
      camera
    })
  }

  ngOnInit() {
  }

  ngAfterViewInit() {

  }

  async seleccionarFoto(index: number) {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      quality: 60,
      width: 1280,
      height: 1280,
    });

    const base64 = image.dataUrl!.split(',')[1];
    const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], {
      type: 'image/jpeg',
    });

    this.imagenes[index] = {
      file: new File([blob], `foto_${index + 1}.jpg`, { type: 'image/jpeg' }),
      preview: image.dataUrl!,
    };
  }



  get botonDeshabilitado(): boolean {
    return this.formularioPlato.invalid || this.imagenes.some(img => !img.file);
  }


  async agregarPlato() {
    if (this.botonDeshabilitado) {
      await this.dialogService.presentToast('Complete todos los campos e imágenes antes de registrar el plato.');
      return;
    }

    const loading = await this.modalController.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });
    await loading.present();

    try {
      // 1️⃣ Subir todas las imágenes
      const fotosUrls: string[] = [];
      for (let i = 0; i < this.imagenes.length; i++) {
        const img = this.imagenes[i];
        if (img.file) {
          // Suponiendo que tienes un método storage.uploadImage()
          const url = await this.storage.uploadImage(img.file);
          fotosUrls.push(url ?? '');
        }
      }

      // 2️⃣ Preparar objeto del plato
      const { nombre = '', descripcion = '', tiempo = 0, precio = 0, tipo = '' } = this.formularioPlato.value;
      const plato = {
        idProducto: Date.now(), // id automático (puede ser otro generador si querés)
        nombre,
        detalle: descripcion,
        tiempo: Number(tiempo),
        precio: Number(precio),
        tipo,
        fotos: fotosUrls,
        push_token: this.formularioPlato.value.push_token || ''
      };

      // 3️⃣ Guardar en Firestore usando tu método existente
      await this.db.agregarProducto(plato, 'productos');

      // 4️⃣ Reset de formulario e imágenes
      this.formularioPlato.reset();
      this.imagenes = [
        { file: null, preview: null },
        { file: null, preview: null },
        { file: null, preview: null },
      ];

      loading.dismiss();
      await this.dialogService.presentToast('El plato ha sido registrado correctamente.', 'success');
    } catch (error) {
      loading.dismiss();
      console.error('Error al registrar plato:', error);
      await this.dialogService.presentToast('Error al registrar el plato.', 'danger');
    }
  }



}
