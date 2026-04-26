
 export function soloNumeros(event: any) {
    const input = event.target.value;
    // Reemplaza cualquier carácter que no sea número
    const soloNums = input.replace(/[^0-9]/g, '');
    event.target.value = soloNums; // actualiza el input
  }

 export function soloLetras(event: any) {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
}