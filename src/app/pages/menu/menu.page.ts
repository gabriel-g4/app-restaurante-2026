import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from 'src/app/services/database.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    homeOutline,
    chatbubblesOutline,
    logOutOutline,
    cartOutline,
    informationCircleOutline,
    remove,
    add
} from 'ionicons/icons';
import {
    IonHeader, IonToolbar, IonButtons, IonTitle,
    IonContent, IonLabel, IonIcon,
    IonSegment, IonSegmentButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton, IonBackButton, IonSpinner, IonFooter
} from "@ionic/angular/standalone";


import { MenuController } from '@ionic/angular';
import { DetallePedidoModalComponent } from 'src/app/components/detalle-pedido-modal/detalle-pedido-modal.component';
import { AuthService } from '../../services/auth.service';
// Swiper
import { register } from 'swiper/element/bundle';
register();


@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule,
        FormsModule,
        IonHeader, IonToolbar, IonButtons, IonTitle,
        IonContent, IonLabel, IonIcon,
        IonSegment, IonSegmentButton, IonCard, IonCardHeader,
        IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonBackButton, IonFooter, IonSpinner]
})
export class MenuPage implements OnInit {
segment: string = 'comida';
    productosFiltrados: { [key: string]: any[] } = { comida: [], bebida: [], postre: [] };
    carrito: any[] = [];
    loading: boolean = true;
    idPedido: string = ''
    estadoAnterior: string = ''
    public deliveryMode = false;
    private deliveryAddress = '';

    constructor(
        private db: DatabaseService,
        private router: Router,
        private modalCtrl: ModalController,
        private menuCtrl: MenuController,
        private auth: AuthService,
        private route: ActivatedRoute,
    ) {
        addIcons({
            homeOutline,
            chatbubblesOutline,
            logOutOutline,
            cartOutline,
            informationCircleOutline,
            remove,
            add,
        });
    }

  async ngOnInit() {
  console.log('[INIT] Cargando productos...');
  this.loading = true;

  // 1) Traigo los productos
  (await this.db.traerColeccion('productos')).subscribe(async (productos: any[]) => {
    console.log('[PRODUCTOS]', productos);

    // Inicializo estructura
    this.productosFiltrados = { comida: [], bebida: [], postre: [] };

    // 2) Traigo el pedido del usuario
    const user = this.auth.getCurrentUser();
    let pedido = null;

    if (user) {
      pedido = await this.db.traerUltimoPedidoDeCliente(user.uid); 
      this.estadoAnterior = pedido?.estado === 'rechazado' ? 'rechazado' : '';
      this.idPedido = pedido?.id || '';
    }

    console.log('[PEDIDO ENCONTRADO]', pedido);

    // Si existe pedido y está rechazado, saco cantidades previas
    const cantidades: { [key: string]: number } = {};

    if (pedido && pedido.estado === 'rechazado' && Array.isArray(pedido.productos)) {
      pedido.productos.forEach((p: any) => {
        cantidades[p.id] = p.cantidad;
      });
    }

    // 3) Recorro todos los productos y les asigno cantidad
    productos.forEach((p: any) => {
      p.cantidad = cantidades[p.id] || 0; // si no existe → 0
      this.productosFiltrados[p.tipo].push(p);

      if (p.cantidad > 0) {
            this.carrito.push({ ...p });
        }
    });

    console.log('[FINAL]', this.productosFiltrados);

    this.loading = false;
  });
}


    incrementarCantidad(producto: any) {
        if (!producto.cantidad) producto.cantidad = 0;
        producto.cantidad++;
        this.actualizarCarrito(producto);
    }

    decrementarCantidad(producto: any) {
        if (producto.cantidad && producto.cantidad > 0) {
            producto.cantidad--;
            this.actualizarCarrito(producto);
        }
    }

    actualizarCarrito(producto: any) {

        const existente = this.carrito.find(p => p.id === producto.id);

        if (producto.cantidad > 0) {
            if (existente) {
                existente.cantidad = producto.cantidad;
            } else {
                this.carrito.push({ ...producto });
            }
        } else {

            this.carrito = this.carrito.filter(p => p.id !== producto.id);
        }

    }

    calcularTotal(): number {
        return this.carrito.reduce((total, producto) => {
            return total + (producto.precio * producto.cantidad);
        }, 0);
    }

    calcularTiempoMaximo(): number {
        if (this.carrito.length === 0) return 0;
        return Math.max(...this.carrito.map(producto => producto.tiempo));
    }

    
    async verDetallePedido() {
        const modal = await this.modalCtrl.create({
            component: DetallePedidoModalComponent,
            componentProps: {
                carrito: this.carrito, // Pasar el carrito actual
                idPedido: this.idPedido,
                estadoAnterior: this.estadoAnterior
            }
        });

        await modal.present();

        // Opcional: Manejar el resultado cuando se cierra el modal
        const { data } = await modal.onWillDismiss();
        if (data?.ordenRealizada) {
            // Limpiar carrito si se realizó la orden
            this.carrito = [];
        }
    }

    navigateTo(path: string) {
        this.router.navigate([path]);
    }
    

    


}
