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
}
