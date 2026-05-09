import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';


@Injectable({
  providedIn: 'root'
})
export class EmailService {

  // private serviceID = 'service_ic2o3ya';
  private serviceID = 'service_h20zc5l';
  templateAccountID = 'template_pipcjju';
  private userID = 'AOv2XmDwsNDYRa9Pf';

  constructor() {}

  enviarCorreo(datos: {
    nombre: string;
    estado: string;
    mensaje: string;
    email: string;
    foto: string;
    foto_portada: string;
    color_portada: string;
    size_mensaje: number;
    fuente: string;
  } , template: string): Promise<EmailJSResponseStatus> {
    // } , template: string) {
    const templateParams = {
      nombre: datos.nombre,
      estado: datos.estado,
      mensaje: datos.mensaje,
      email: datos.email,
      foto_portada: datos.foto_portada,
      foto: datos.foto,
      color_portada: datos.color_portada,
      size_mensaje: datos.size_mensaje,
      fuente: datos.fuente
    };

    return emailjs.send(this.serviceID, template || this.templateAccountID, templateParams, this.userID);
  }
}
