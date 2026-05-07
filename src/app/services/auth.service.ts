import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  usuario$ = authState(this.auth);
  private rolActual: string = '';

  constructor(private auth: Auth) { }

  iniciarSesionConContrasenia(correo: string, contrasenia: string) {
    return signInWithEmailAndPassword(this.auth, correo, contrasenia);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  cerrarSesion() {
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

}
