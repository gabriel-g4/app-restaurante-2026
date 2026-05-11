import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSpinner } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-informacion-mesa',
  templateUrl: './informacion-mesa.page.html',
  styleUrls: ['./informacion-mesa.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, TitleCasePipe, IonBackButton, IonButtons, IonSpinner]
})
export class InformacionMesaPage implements OnInit {

  idMesa: string | null = null;
  infoMesa: any = null;
  cargo: boolean = false;

  constructor(private route: ActivatedRoute, private databaseService: DatabaseService) {}

  async ngOnInit() {
    this.idMesa = this.route.snapshot.paramMap.get('idMesa');

    console.log("🌐 Param URL recibido (raw):", this.idMesa);

    if (!this.idMesa) {
      console.error("❌ No se recibió URL para redireccionar.");
      return;
    }

    try {
      const id = Number(this.idMesa)
      this.infoMesa = await this.databaseService.obtenerMesa(id);
      this.cargo = true;
      console.log("Mesa: ")
      console.log(this.infoMesa)

    } catch(error) {
      this.cargo = true;
      console.error("Error al obtener la mesa: ", error);
    }
    
  }
}
