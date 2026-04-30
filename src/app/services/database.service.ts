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
  getDoc
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

  
}
