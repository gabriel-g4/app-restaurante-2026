import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonLabel,
  IonButton,
  IonSpinner,
  IonButtons,
  IonBackButton,
  ModalController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  menuOutline,
  fastFoodOutline,
  wineOutline,
  checkmarkSharp,
} from 'ionicons/icons';
import { PedidoService } from 'src/app/services/pedido.service';
import { register } from 'swiper/element/bundle';
// register Swiper custom elements
register();
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SpinnerModalComponent } from 'src/app/components/spinner-modal/spinner-modal.component';

@Component({
  selector: 'app-orders-cocinero',
  templateUrl: './orders-cocinero.page.html',
  styleUrls: ['./orders-cocinero.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonLabel,
    IonButton,
    IonSpinner,
    IonButtons,
    IonBackButton,
  ],
})
export class OrdersCocineroPage implements OnInit {
  userRole: string | null = null;
  pedidos: any[] = [];
  private unsubscribePedidos: any;

  constructor(
    private auth: AuthService,
    private dbService: DatabaseService,
    private pedidoService: PedidoService,
    private modalController: ModalController
  ) {
    addIcons({
      logOutOutline,
      menuOutline,
      fastFoodOutline,
      wineOutline,
      checkmarkSharp,
    });
  }

  async ngOnInit() {
    const user = await this.auth.getCurrentUserAsync();

    if (user) {
      const userData = await this.dbService.obtenerUsuarioPorId(user.uid);

      if (userData) {
        this.userRole = userData.rol.toLowerCase();

        this.suscribirAPedidos();
      } else {
        console.warn('[DB] No se encontró data del usuario en "usuarios".');
      }
    }
  }

  ngOnDestroy() {
    console.log('[DESTROY] Cancelando suscripción de pedidos...');
    // if (this.unsubscribePedidos) {
      // this.unsubscribePedidos();
      this.pedidoService.cancelarSuscripcion();
    // }
  }

  suscribirAPedidos() {
    console.log('[SUB] Suscribiendo a pedidos...');

    this.unsubscribePedidos = this.pedidoService.suscribirAPedidos(
      ['en preparación', 'cocina lista', 'bebida lista', 'confirmado'],
      (pedidos) => {
        console.log('[SUB] Pedidos recibidos desde Firestore:', pedidos);

        this.pedidos = pedidos
          .map((pedido) => {
            console.log('[MAP] Procesando pedido:', pedido);
            return this.filtrarYProcesarPedido(pedido);
          })
          .filter((pedido) => {
            const mostrar = this.debeMostrarPedido(pedido);
            console.log(
              `[FILTER] Pedido ${pedido.id} mostrar=${mostrar}`,
              pedido
            );
            return mostrar;
          });

        console.log('[RESULT] Pedidos visibles:', this.pedidos);
      }
    );
  }

  filtrarYProcesarPedido(pedido: any): any {
    console.log('[PROC] Filtrando productos para pedido:', pedido.id);

    const pedidoProcesado = { ...pedido };

    pedidoProcesado.productos = pedido.productos.filter((producto: any) => {
      const permitido = this.esCocinero
        ? producto.tipo === 'comida' || producto.tipo === 'postre'
        : producto.tipo === 'bebida';

      console.log(
        `[PROC] Producto ${producto.idProducto} (${producto.tipo}) permitido=${permitido}`
      );

      return permitido;
    });

    pedidoProcesado.todosPreparados =
      pedidoProcesado.productos.length > 0 &&
      pedidoProcesado.productos.every(
        (p: any) => p.estadoProducto === 'preparado'
      );

    console.log('[PROC] Todos preparados:', pedidoProcesado.todosPreparados);

    if (pedidoProcesado.productos.length > 0) {
      pedidoProcesado.tiempoMaxPreparacion = Math.max(
        ...pedidoProcesado.productos.map((p: any) => p.tiempo || 0)
      );
      console.log(
        '[PROC] Tiempo máximo de preparación:',
        pedidoProcesado.tiempoMaxPreparacion
      );
    }

    return pedidoProcesado;
  }

  debeMostrarPedido(pedido: any): boolean {
    const tieneProductos = pedido.productos.length > 0;
    console.log(
      `[CHECK] Pedido ${pedido.id} tiene productos para este rol=${tieneProductos}`
    );

    if (this.esCocinero) {
      const mostrar = tieneProductos && pedido.estado !== 'cocina lista';
      console.log(`[CHECK] ES COCINERO -> mostrar=${mostrar}`);
      return mostrar;
    } else {
      const mostrar = tieneProductos && pedido.estado !== 'bebida lista';
      console.log(`[CHECK] ES BARTENDER -> mostrar=${mostrar}`);
      return mostrar;
    }
  }

  async cambiarEstadoProducto(pedido: any, producto: any) {
    console.log('[UPDATE] Cambiando estado producto:', producto);

    if (producto.estadoProducto === 'preparado' || producto.isLoading) return;

    producto.isLoading = true; // Inicia el spinner

    try {
      // La actualización optimista de la UI se hará después del await
      // o será manejada por el listener de Firestore.
      // Por ahora, el spinner indica que la acción está en progreso.

      await this.pedidoService.actualizarEstadoProducto(
        pedido.id,
        producto.idProducto,
        'preparado'
      );

      // Una vez que la BD se actualiza, el listener de Firestore refrescará la lista
      // y el producto aparecerá como 'preparado'.
      // Para una respuesta más rápida, podemos actualizarlo aquí también.
      producto.estadoProducto = 'preparado';

      console.log('[UPDATE] Producto actualizado correctamente.');
    } catch (error) {
      // Si hay un error, no cambiamos el estado del producto.
      console.error('Error al actualizar producto:', error);
      this.pedidoService.mostrarToast('Error al actualizar producto', 'danger');
    } finally {
      // Este bloque se ejecuta siempre, haya o no un error.
      // Nos aseguramos de detener el spinner.
      producto.isLoading = false;
    }
  }

  async marcarPedidoEntregado(pedidoId: string, idMesa: string) {
    const loading = await this.modalController.create({
      component: SpinnerModalComponent,
      cssClass: 'spinner-modal',
      backdropDismiss: false
    });

    loading.present();
    console.log(
      `[MARK] Marcando pedido ${pedidoId} como entregado. Mesa: ${idMesa}`
    );

    try {
      const tipo = this.esCocinero ? 'comida' : 'bebida';
      await this.pedidoService.marcarComoListoParaEntregar(
        pedidoId,
        tipo,
        idMesa
      );
      loading.dismiss();
      console.log('[MARK] Pedido marcado como listo para entregar.');
    } catch (error) {
      loading.dismiss();
      console.error('Error al marcar pedido como listo:', error);
    }
  }

  getEstadoPedido(pedido: any): string {
    if (pedido.estado === 'listo para servir') return 'Listo para servir';
    if (this.esCocinero && pedido.estado === 'bebida lista')
      return 'Esperando bebidas';
    if (this.esBartender && pedido.estado === 'cocina lista')
      return 'Esperando comidas';
    return 'En preparación';
  }

  getColorEstado(pedido: any): string {
    if (pedido.estado === 'listo para servir') return 'success';
    if (pedido.estado === 'cocina lista' || pedido.estado === 'bebida lista')
      return 'warning';
    return 'primary';
  }

  get esCocinero(): boolean {
    return this.userRole === 'cocinero';
  }

  get esBartender(): boolean {
    return this.userRole === 'bartender';
  }

  formatearIdPedido(id: string): string {
    return id ? id.toUpperCase() : '';
  }
}
