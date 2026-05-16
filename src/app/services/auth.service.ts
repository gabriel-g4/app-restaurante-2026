import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, createUserWithEmailAndPassword, onAuthStateChanged,  } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  usuario$ = authState(this.auth);
  private rolActual: string = '';

  constructor(private auth: Auth, private firestore: Firestore) { }

  iniciarSesionConContrasenia(correo: string, contrasenia: string) {
    return signInWithEmailAndPassword(this.auth, correo, contrasenia);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  async cerrarSesion() {
     const user = this.auth.currentUser;

    if (user) {

      const userRef = doc(this.firestore, 'usuarios', user.uid);

      await updateDoc(userRef, {
        push_token: ''
      });
    }
    this.rolActual = '';
    return signOut(this.auth);
  }

  setRol(rol: string) {
    this.rolActual = rol;
  }

  getRol(): string {
    return this.rolActual;
  }

  getCurrentUser(): any {
    return this.auth.currentUser;
  }

  async getCurrentUserAsync(): Promise<any> {
    return new Promise(resolve => {
      onAuthStateChanged(this.auth, user => {
        resolve(user);
      });
    });
  }

}
