import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  query,
  where,
  getDocs,
  addDoc,
  runTransaction,
  orderBy,
  getDoc,
  docData,
  and,
  or,
  writeBatch
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class DatabaseService {

  constructor(private firestore: Firestore) { }

  async obtenerUsuarioPorEmail(email: string) {

    try {
      const usersRef = collection(this.firestore, 'usuarios');

      const q = query(usersRef, where('email', '==', email));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      querySnapshot.docs.forEach((doc, index) => {
        console.log(`🔍 Doc ${index}: id=${doc.id}, data=`, doc.data());
      });

      const userData = querySnapshot.docs[0].data();

      return userData;

    } catch (error) {
      console.error("🛑 Error en obtenerUsuarioPorEmail:", error);
      throw error;
    }
  }

  async obtenerUsuarioPorId(uid: string): Promise<any> {
    try {

      const col = collection(this.firestore, 'usuarios');

      // Primero buscamos por "id"
      let q = query(col, where('id', '==', uid));
      let snapshot = await getDocs(q);

      // Si no encontramos nada, buscamos por "uid"
      if (snapshot.empty) {
        q = query(col, where('uid', '==', uid));
        snapshot = await getDocs(q);
      }

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      } else {
        console.log('No se encontró el usuario.');
        return null;
      }

    } catch (error) {
      console.error('Error obteniendo el usuario:', error);
      return null;
    }
  }

  async agregarProducto(producto: any, coleccion: string) {
    try {
      const col = collection(this.firestore, coleccion);
      const docRef = await addDoc(col, producto);

      console.log('Producto agregado exitosamente con ID:', docRef.id);
    } catch (error) {
      console.error('Error al agregar el producto:', error);
    }
  }

  async agregarUsuario(user: any, coleccion: string) {
    try {
      const userRef = doc(this.firestore, `${coleccion}/${user.id}`);
      await setDoc(userRef, { ...user });

      console.log('Usuario agregado exitosamente con ID:', user.id);
    } catch (error) {
      console.error('Error al agregar el usuario:', error);
    }
  }

  obtenerClientesPendientes(): Observable<any[]> {
    const usersRef = collection(this.firestore, 'usuarios');
    // Busca a los que tengan el perfil 'cliente' y su estado sea 'pendiente'
    const q = query(
      usersRef,
      and(
        or(
          where('perfil', '==', 'cliente'),
          where('rol', '==', 'cliente')
        ),
        where('estado', '==', 'pendiente')
      )
    );
    return collectionData(q, { idField: 'id' });
  }

  async rechazarCliente(usuarioId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `usuarios/${usuarioId}`);
      await updateDoc(userDocRef, {
        estado: 'rechazado'
      });
      console.log(`Cliente ${usuarioId} rechazado con éxito.`);
    } catch (error) {
      console.error("Error al rechazar cliente:", error);
      throw error;
    }
  }

  async aceptarCliente(usuarioId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `usuarios/${usuarioId}`);
      await updateDoc(userDocRef, {
        estado: 'aprobado'
      });
      console.log(`Cliente ${usuarioId} aprobado con éxito.`);
    } catch (error) {
      console.error("Error al aprobar cliente:", error);
      throw error;
    }
  }

  // --- CHAT CLIENTE - MOZO ---
  async enviarMensajeChat(emisorId: string, emisorPerfil: string, texto: string, mesaId: string) {
    try {
      const chatRef = collection(this.firestore, 'chat');
      await addDoc(chatRef, {
        emisorId: emisorId,
        emisorPerfil: emisorPerfil,
        texto: texto,
        mesaId: mesaId,
        fecha: new Date().getTime()
      });
    } catch (error) {
      console.error('Error enviando mensaje: ', error);
      throw error;
    }
  }

  obtenerMensajesMesa(mesaId: string): Observable<any[]> {
    const chatRef = collection(this.firestore, 'chat');
    const q = query(
      chatRef,
      where('mesaId', '==', mesaId),
      orderBy('fecha', 'asc')
    );

    return collectionData(q, { idField: 'id' });
  }


  // --- JUEGOS Y DESCUENTOS ---

  obtenerDescuentoCliente(clienteId: string): Observable<any> {
    const userDocRef = doc(this.firestore, `usuarios/${clienteId}`);
    return docData(userDocRef);
  }

  async guardarDescuentoGanado(clienteId: string, porcentaje: number) {
    try {
      const userDocRef = doc(this.firestore, `usuarios/${clienteId}`);
      await updateDoc(userDocRef, {
        descuentoGanado: porcentaje,
        juegoJugado: true
      });
    } catch (error) {
      console.error("Error guardando descuento:", error);
    }
  }

  async registrarIntentoFallido(clienteId: string) {
    try {
      const userDocRef = doc(this.firestore, `usuarios/${clienteId}`);
      await updateDoc(userDocRef, {
        juegoJugado: true
      });
    } catch (error) {
      console.error("Error registrando intento:", error);
    }
  }

  // MESAS

  async verificarExistenciaMesa(numero: number): Promise<boolean> {
    try {
      const col = collection(this.firestore, 'mesas');
      const q = query(col, where('idMesa', '==', numero));
      const snapshot = await getDocs(q);
      return !snapshot.empty; // true si ya existe
    } catch (error) {
      console.error('Error verificando existencia de la mesa:', error);
      return false;
    }
  }


  async agregarMesa(newTable: any): Promise<string> {
    try {
      const numeroMesa = newTable.numero; // número que ingresa el usuario
      if (!numeroMesa) throw new Error('El número de mesa es obligatorio');

      // Creamos la mesa con idMesa = numero de mesa
      const mesaData = {
        ...newTable,
        idMesa: numeroMesa,         // usamos el número de mesa como ID
        estado: newTable.estado || 'libre', // Default
      };

      // Guardamos en Firestore usando el idMesa como ID de documento
      await setDoc(doc(this.firestore, 'mesas', numeroMesa.toString()), mesaData);

      console.log('Mesa agregada exitosamente con idMesa:', numeroMesa);
      return numeroMesa.toString(); // Devuelve el idMesa
    } catch (error) {
      console.error('Error al agregar la mesa:', error);
      throw error;
    }
  }

  async obtenerMesa(id: number) {

    try {
      const usersRef = collection(this.firestore, 'mesas');

      const q = query(usersRef, where('idMesa', '==', id));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // querySnapshot.docs.forEach((doc, index) => {
      //   console.log(`🔍 Doc ${index}: id=${doc.id}, data=`, doc.data());
      // });

      const mesasData = querySnapshot.docs[0].data();

      return mesasData;

    } catch (error) {
      console.error("🛑 Error en obtenerMesa:", error);
      throw error;
    }
  }

  // 
  async generarIdSecuencial(
    coleccion: string,
    prefijo: string = 'p'
  ): Promise<string> {
    const counterRef = doc(this.firestore, 'counters', coleccion);

    try {
      return await runTransaction(this.firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nuevoNumero = 1;

        if (counterDoc.exists()) {
          nuevoNumero = counterDoc.data()['ultimoNumero'] + 1;
        }

        // Actualiza el contador
        transaction.set(counterRef, { ultimoNumero: nuevoNumero });

        // Formatea el número con ceros a la izquierda
        const numeroFormateado = nuevoNumero.toString().padStart(4, '0');
        return `${prefijo}${numeroFormateado}`;
      });
    } catch (error) {
      console.error('Error generando ID secuencial:', error);
      throw error;
    }
  }

  async puedeHacerNuevoPedido(uid: string): Promise<boolean> {
    try {
      // 1. Traer TODOS los pedidos del usuario
      const col = collection(this.firestore, 'pedidos');
      const q = query(col, where('idUsuario', '==', uid));
      const snapshot = await getDocs(q);

      // 2. Si no tiene pedidos, puede hacer uno nuevo
      if (snapshot.empty) return true;

      // 3. Verificar que TODOS estén en 'pago confirmado'
      const todosConfirmados = snapshot.docs.every(doc =>
        doc.data()['estado'] === 'pago confirmado'
      );

      return todosConfirmados;
    } catch (error) {
      console.error('Error verificando pedidos:', error);
      throw error;
    }
  }

  async agregarLog(log: any, coleccion: string) {
    try {
      const col = collection(this.firestore, coleccion);
      const docRef = await addDoc(col, log);
      console.log('Log agregado exitosamente con ID:', docRef.id);
    } catch (error) {
      console.error('Error al agregar el log:', error);
    }
  }

  async actualizarEstadoMesasPorReservasVencidas() {
    const ahora = new Date();
    const umbralCancelacion = new Date(ahora.getTime() - 45 * 60 * 1000); // 45 minutos en el pasado

    const reservasRef = collection(this.firestore, 'reservas');
    // Buscamos reservas 'Confirmadas' que debieron empezar antes del umbral de tiempo.
    // El estado 'Confirmada' implica que el cliente aún no ha llegado y escaneado el QR de la mesa.
    const q = query(
      reservasRef,
      where('estado', '==', 'Confirmada'),
      where('fechaHora', '<=', umbralCancelacion.toISOString())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("No hay reservas vencidas para cancelar.");
      return; // No hay nada que hacer
    }

    // Usamos un batch para realizar todas las escrituras en una sola operación atómica.
    const batch = writeBatch(this.firestore);

    snapshot.forEach(docSnap => {
      const reserva = docSnap.data() as { id?: string, estado: string, mesaId?: string };
      console.log(`Cancelando reserva vencida para la mesa ${reserva.mesaId}`);

      // 1. Actualizamos la reserva a 'Cancelada'
      const reservaRef = doc(this.firestore, 'reservas', docSnap.id);
      batch.update(reservaRef, {
        estado: 'Cancelada',
        motivoRechazo: 'Cancelada automáticamente por no presentarse.'
      });

      // 2. Si tiene una mesa asignada, la liberamos
      if (reserva.mesaId) {
        const mesaRef = doc(this.firestore, 'mesas', reserva.mesaId);
        batch.update(mesaRef, { estado: 'libre' });
      }
    });

    // Ejecutamos todas las operaciones del batch
    await batch.commit();
    console.log(`Se procesaron y cancelaron ${snapshot.size} reservas vencidas.`);
}

  async traerColeccion(nombreColeccion: string) {
    console.log("collectionData:");
    console.log(collectionData)

    console.log("traer coleccion")
    console.log(this.firestore)
    
    if (nombreColeccion == "mesas") {
      await this.actualizarEstadoMesasPorReservasVencidas().catch(err => console.error("Error al actualizar estado de mesas:", err));
    }

    const col = collection(this.firestore, nombreColeccion);
    console.log(col)
    console.log("Query path:", (col as any)._query.path.segments);

    return collectionData(col, { idField: 'id' });
}

   async modificarUsuario(usuario: any, coleccion: string) {
    try {
      const docRef = doc(this.firestore, `${coleccion}/${usuario.id}`);
      await updateDoc(docRef, { ...usuario });
    } catch (error) {
      console.error('Error al modificar usuario:', error);
    }
  }

  async traerUltimoPedidoDeCliente(uid: string): Promise<any | null> {
    try {
      const colRef = collection(this.firestore, 'pedidos');

      // Traemos pedidos del usuario ordenados por fecha descendente
      const q = query(
        colRef,
        where('idUsuario', '==', uid),
        // IMPORTANTE: fecha debe ser Timestamp o Date en Firestore
        orderBy('fecha', 'desc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const docSnap = snapshot.docs[0];
      return {
        id: docSnap.id,
        ...docSnap.data()
      };

    } catch (error) {
      console.error('❌ Error al traer el último pedido del cliente:', error);
      return null;
    }
  }

  async crear(coleccion: string, data: any): Promise<string> {
    try {
      const col = collection(this.firestore, coleccion);
      const docRef = await addDoc(col, data);

      // Opcional: Guardar el ID autogenerado dentro del mismo documento
      await updateDoc(doc(this.firestore, coleccion, docRef.id), { id: docRef.id });

      console.log('Documento creado exitosamente con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(`Error al crear documento en ${coleccion}:`, error);
      throw error;
    }
  }
}


