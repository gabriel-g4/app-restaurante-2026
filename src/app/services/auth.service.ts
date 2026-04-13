import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  usuario$ = authState(this.auth);

  constructor(private auth: Auth) {}

  iniciarSesionConContrasenia(correo: string, contrasenia: string) {
    return signInWithEmailAndPassword(this.auth, correo, contrasenia);
  }

  cerrarSesion() {
    return signOut(this.auth);
  }

}
