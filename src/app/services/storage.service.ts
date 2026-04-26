import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class StorageService {

    private cloudName = 'dviolblps';
    private cloudinaryUrl =  `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    private cloudinaryPdfUrl =  `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`;
    private presentName = 'ml_default';
    private presetNamePDF = 'pdf_unsigned';

    constructor() { }


    async uploadImage(file: File | Blob): Promise<string | null> {
        try {
            const finalFile = file instanceof File
                ? file
                : new File([file], 'foto.jpg', { type: file.type });

            const formData = new FormData();
            formData.append('file', finalFile);
            formData.append('upload_preset', this.presentName);

            const response = await fetch(this.cloudinaryUrl, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.secure_url) {
                return result.secure_url; // URL segura de la imagen
            } else {
                throw new Error('Error en la subida de la imagen.');
            }
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            return null;
        }
    }

      async uploadPdf(file: File | Blob, filename = 'documento.pdf'): Promise<string | null> {
        try {
            const finalFile = file instanceof File
                ? file
                : new File([file], filename, { type: file.type });

            const formData = new FormData();
            formData.append('file', finalFile);
            formData.append('upload_preset', this.presetNamePDF);

            const response = await fetch(this.cloudinaryPdfUrl, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            console.log(result)
            if (result.secure_url) {
                return result.secure_url; // URL segura del PDF
            } else {
                throw new Error('Error en la subida del PDF.');
            }
        } catch (error) {
            console.error('Error al subir el PDF:', error);
            return null;
        }
    }

    // Generar una URL optimizada manualmente
    getOptimizedUrl(publicId: string): string {
        return `https://res.cloudinary.com/${this.cloudName}/image/upload/f_auto,q_auto/${publicId}`;
    }

    // Generar una URL transformada manualmente
    getTransformedUrl(publicId: string, width: number, height: number): string {
        return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_crop,g_auto,w_${width},h_${height}/${publicId}`;
    }

}