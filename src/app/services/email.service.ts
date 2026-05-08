import { Injectable } from '@angular/core';
// import emailjs, { EmailJSResponseStatus } from 'emailjs-com';


@Injectable({
  providedIn: 'root'
})
export class EmailService {

  // private serviceID = 'service_ic2o3ya';
  private serviceID = 'service_ghppyhw';
  private templateID = 'template_pipcjju';
  private userID = '4QQlXt5D5KQFN_wzy';

  // https://imgur.com/a/7XN3mDR foto_portada

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
  // } , template: string): Promise<EmailJSResponseStatus> {
    } , template: string) {
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

    // return emailjs.send(this.serviceID, template || this.templateID, templateParams, this.userID);
    return null;
  }
}
