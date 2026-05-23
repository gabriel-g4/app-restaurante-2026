import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonButton, IonBackButton } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  chatbubblesOutline, 
  logOutOutline,
  documentTextOutline,
  eyeOutline
} from 'ionicons/icons';
import { MenuController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database.service';
import { RespuestaEncuestaModal } from 'src/app/components/respuesta-encuesta/respuesta-encuesta.modal';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-menu-encuesta',
  templateUrl: './menu-encuesta.page.html',
  styleUrls: ['./menu-encuesta.page.scss'],
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonTitle, 
    IonContent, IonIcon, IonButton, IonBackButton]
})
export class MenuEncuestaPage implements OnInit {

  pedidoActual: any = null;
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalCtrl: ModalController,
    private db: DatabaseService,
    private dialogService: DialogService
  ) {
    addIcons({ 
      homeOutline, 
      chatbubblesOutline, 
      logOutOutline,
      documentTextOutline,
      eyeOutline
    });

  
    
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['pedido']) {
        this.pedidoActual = JSON.parse(params['pedido']);
        console.log('Pedido recibido:', this.pedidoActual);
      } else {
        console.warn('No se recibió ningún pedido');
        this.pedidoActual = null;
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }


  async completarEncuesta() {
    console.log("Pedido actual", this.pedidoActual)
    if (!this.pedidoActual || !this.pedidoActual.idPedido) {
      this.dialogService.presentToast("No hay un pedido seleccionado");
      return;
    }

    // Verificar si ya existe una encuesta para este pedido

    
    const encuestas = await this.db.obtenerEncuestasPorPedido(this.pedidoActual.idPedido);

   
    
    if (encuestas && encuestas.length > 0) {
      // Mostrar toast si ya existe una encuesta
      this.dialogService.presentToast('Ya respondiste esta encuesta');
      
    } else {
      // Navegar a la página de encuesta con el idPedido
      this.router.navigate(['/client-survey'], {
        queryParams: { idPedido: this.pedidoActual.idPedido }
      });
    }
  }

  async verEncuesta() {
    // Abrir el modal con las encuestas encontradas
    const modal = await this.modalCtrl.create({
      component: RespuestaEncuestaModal,
      componentProps: {
      },
      cssClass: 'encuesta-modal-custom'
    });

    await modal.present();
  }

}
