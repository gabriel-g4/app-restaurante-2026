import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'App Restaurante',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,      // no se oculta automáticamente
      showSpinner: false,         // sin spinner
      backgroundColor: "#0c53b0", // mismo fondo que tu página Angular
      androidScaleType: "CENTER_CROP" // no importa la imagen
    }
  }
};

export default config;
