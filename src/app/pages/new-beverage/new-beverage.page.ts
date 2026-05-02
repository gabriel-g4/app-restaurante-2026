import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { soloLetras, soloNumeros } from 'src/utils/helpers';
import { DatabaseService } from 'src/app/services/database.service';
import { DialogService } from 'src/app/services/dialog.service';
import { StorageService } from 'src/app/services/storage.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { qrCodeOutline, camera } from 'ionicons/icons';


interface Imagen {
  file: File | null;
  preview: string | null;
}

@Component({
  selector: 'app-new-beverage',
  templateUrl: './new-beverage.page.html',
  styleUrls: ['./new-beverage.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonBackButton, ReactiveFormsModule, IonIcon]
})
export class NewBeveragePage implements OnInit {

    soloLetras = soloLetras;
    soloNumeros = soloNumeros;
    selectedFile: File | null = null;
    imagenPreview: string | null = null;
    imagenes: Imagen[] = [
      { file: null, preview: null },
      { file: null, preview: null },
      { file: null, preview: null },
    ];
    formularioBebida = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    descripcion: new FormControl('', [Validators.required]),
    tiempo: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    precio: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    push_token: new FormControl('')
  });

  constructor(private dialogService: DialogService,
    private db: DatabaseService,
    private storage: StorageService) {

        
    addIcons( {
      qrCodeOutline,
      camera
    })
    }

  ngOnInit() {
  }

  ngAfterViewInit() {  
  }

  async seleccionarFoto(index: number) {
    try { 
    const image = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      quality: 90,
      
    });

      const base64 = image.dataUrl!.split(',')[1];
      const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], {
        type: 'image/jpeg',
      });

      this.imagenes[index] = {
        file: new File([blob], `foto_${index + 1}.jpg`, { type: 'image/jpeg' }),
        preview: image.dataUrl!,
      };
    } catch (error: any) {
      if (error.message === 'User cancelled photos app') {
      console.log('El usuario canceló la selección de la foto.');
    } else {
      console.error('Ocurrió un problema al abrir la cámara:', error);
    }
    }
  }

  
  get botonDeshabilitado(): boolean {
  return this.formularioBebida.invalid || this.imagenes.some(img => !img.file);
}

 async agregarBebida() {
  if (this.botonDeshabilitado) {
    await this.dialogService.presentToast('Complete todos los campos e imágenes antes de registrar el plato.');
    return;
  }

  try {
    const fotosUrls: string[] = []; //subir imagenes
    for (let i = 0; i < this.imagenes.length; i++) {
      const img = this.imagenes[i];
      if (img.file) {
        // Suponiendo que tienes un método storage.uploadImage()
        const url = await this.storage.uploadImage(img.file);
        fotosUrls.push(url ?? '');
      }
    }

    const { nombre = '', descripcion = '', tiempo = 0, precio = 0 } = this.formularioBebida.value;
    const tipo = 'bebida';
    const plato = {
      idProducto: Date.now(),
      nombre,
      detalle: descripcion,
      tiempo: Number(tiempo),
      precio: Number(precio),
      tipo,
      fotos: fotosUrls,
      push_token: this.formularioBebida.value.push_token || ''
    };

    await this.db.agregarProducto(plato, 'productos');

    this.formularioBebida.reset(); 
    this.imagenes = [
      { file: null, preview: null },
      { file: null, preview: null },
      { file: null, preview: null },
    ];

    await this.dialogService.presentToast('El plato ha sido registrado correctamente.');
  } catch (error) {
    console.error('Error al registrar plato:', error);
    await this.dialogService.presentToast('Error al registrar el plato.');
  }
}


}
