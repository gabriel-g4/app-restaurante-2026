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
  or
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
}
