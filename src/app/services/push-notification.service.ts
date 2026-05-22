import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  PushNotifications,
  Token,
  PushNotificationSchema
} from '@capacitor/push-notifications';
import { isPlatform, AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  public push_token: string | null = null;
  private initialized = false;
  public tokenReady = new EventEmitter<string>();

  constructor(private alertController: AlertController, private router : Router) {}

  async initPush() {
  console.log("---- [1] initPush() INICIADO ----");

  // Solo ejecuta en dispositivos con Capacitor
  const isCap = isPlatform('capacitor');
  console.log("[2] isPlatform('capacitor') =", isCap);
  if (!isCap) {
    console.log("[3] No es Capacitor → SALIENDO");
    return;
  }

  // Previene múltiples registros de listeners
  console.log("[4] this.initialized =", this.initialized);
  if (this.initialized) {
    console.log("[5] ⛔ initPush ya había sido inicializado → SALIENDO");
    return;
  }

  try {
    console.log("[6] Solicitando permisos...");
    const perm = await PushNotifications.requestPermissions();
    console.log("[7] Resultado permisos:", perm);

    if (perm.receive !== 'granted') {
      console.warn("[8] ❌ Permiso de notificaciones DENEGADO → SALIENDO");
      return;
    }

    console.log("[9] Permiso otorgado");
   

    console.log("[12] Registrando listeners…");

    // Listener: token obtenido
    PushNotifications.addListener('registration', (token: Token) => {
      console.log("[13] ✅ Listener registration → Token FCM obtenido:", token.value);
      this.push_token = token.value;
      this.tokenReady.emit(token.value);
    });

    // Listener: error en el registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error("[14] ❌ Listener registrationError:", error);
    });

    // Listener: notificación en primer plano
    //     PUSH EN APP
    // {
    //   "id": "0:1764933595525026%f6d21efbf6d21efb",
    //   "data": {
    //     "path": "home"
    //   },
    //   "title": "Nuevo pedido",
    //   "body": "Hay un nuevo pedido pendiente."
    // }

    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        console.log("[15] 📩 Notificación recibida:", notification);
        console.log(JSON.stringify(notification, null, 2));

        const alert = await this.alertController.create({
          cssClass: 'mi-alerta',
          header: notification.title || 'Notificación',
          message: notification.body || 'Sin contenido',
          buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log("❌ Usuario canceló");
          }
        },
        {
          text: 'Aceptar',
          handler: () => {
            console.log("✅ Usuario aceptó");

            // 👉 Aquí hacés lo que necesites
            // IMPORTANTE PUSHES
            this.router.navigate([notification.data.path]);
          }
        }
      ]
        });

        await alert.present();
      }
    );

    // Listener: usuario interactúa
    //     PUSH FUERA
    // {
    //   "actionId": "tap",
    //   "notification": {
    //     "id": "0:1764933832139329%f6d21efbf6d21efb",
    //     "data": {
    //       "google.delivered_priority": "normal",
    //       "google.original_priority": "normal",
    //       "from": "700718634726",
    //       "path": "home",
    //       "collapse_key": "io.ionic.starter"
    //     }
    //   }
    // }
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notif) => {
        console.log("[16] 🔁 Acción en notificación:", notif);
    console.log("🧩 DATA COMPLETA:", JSON.stringify(notif.notification.data, null, 2));

    const path = notif.notification.data?.path;
    console.log("📍 PATH recibido desde la push =", path);

    if (path) {
      console.log("➡️ Navegando hacia:", path);
      this.router.navigate([path]).catch(err => {
        console.error("❌ ERROR al navegar:", err);
      });
    } else {
      console.error("⚠️ No vino path en la push.");
    }
      }
    );

     await PushNotifications.register();
    console.log("[18] ✔ PushNotifications.register() → COMPLETADO (si ves este log, NO crasheó)");

    // Marca como inicializado
    this.initialized = true;
    console.log("[19] this.initialized = true");

    console.log("---- [17] initPush() FINALIZADO SIN ERRORES ----");

  } catch (err) {
    console.error("🔥 [ERROR FATAL en initPush()]", err);
  }
}


  // async initPush() {
  //   // Solo ejecuta en dispositivos con Capacitor
  //   if (!isPlatform('capacitor')) return;

  //   // Previene múltiples registros de listeners
  //   if (this.initialized) {
  //     console.log('⛔ initPush ya fue inicializado');
  //     return;
  //   }

  //   // Solicita permisos
  //   const perm = await PushNotifications.requestPermissions();
  //   if (perm.receive !== 'granted') {
  //     console.warn('❌ Permiso de notificaciones denegado');
  //     return;
  //   }

  //   // Registra el dispositivo en FCM
  //   await PushNotifications.register();

  //   // ✅ Marca como inicializado antes de registrar los listeners
  //   this.initialized = true;

  //   // Listener: token obtenido
  //   PushNotifications.addListener('registration', (token: Token) => {
  //     console.log('✅ Token FCM obtenido:', token.value);
  //     this.push_token = token.value;
  //     // Enviar al backend si lo necesitás
  //   });

  //   // Listener: error en el registro
  //   PushNotifications.addListener('registrationError', (error) => {
  //     console.error('❌ Error de registro:', error);
  //   });

  //   // Listener: notificación recibida en primer plano
  //   PushNotifications.addListener(
  //     'pushNotificationReceived',
  //     async (notification: PushNotificationSchema) => {
  //       console.log('📩 Notificación recibida:', notification);

  //       const alert = await this.alertController.create({
  //         header: notification.title || 'Notificación',
  //         message: notification.body || 'Sin contenido',
  //         buttons: ['Aceptar']
  //       });

  //       await alert.present();
  //     }
  //   );

  //   // Listener: usuario interactúa con la notificación
  //   PushNotifications.addListener(
  //     'pushNotificationActionPerformed',
  //     (notification) => {
  //       console.log('🔁 Acción en notificación:', notification);
  //       // Podés hacer navegación si incluís un "path" en el `data` del backend
  //     }
  //   );
  // }

  async clearToken() {
    this.push_token = null;
    this.initialized = false;
    await PushNotifications.removeAllListeners();
     
    // Si tenés backend, avisale que se limpió
  }
}
