import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface Photo {
  webPath: string;
  format: string;
  dataUrl?: string;
}

/**
 * Toma una foto usando la cámara del dispositivo
 */
export const takePhoto = async (): Promise<Photo | null> => {
  if (!Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable('Camera')) {
    console.log('Camera plugin not available');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    return {
      webPath: image.webPath || '',
      format: image.format || 'jpeg',
      dataUrl: image.dataUrl,
    };
  } catch (error: any) {
    if (error.message?.includes('cancel') || error.message?.includes('Cancel')) {
      console.log('Photo capture cancelled by user');
    } else {
      console.error('Error taking photo:', error);
    }
    return null;
  }
};

/**
 * Selecciona una foto desde la galería
 */
export const pickFromGallery = async (): Promise<Photo | null> => {
  if (!Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable('Camera')) {
    console.log('Camera plugin not available');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    return {
      webPath: image.webPath || '',
      format: image.format || 'jpeg',
      dataUrl: image.dataUrl,
    };
  } catch (error: any) {
    if (error.message?.includes('cancel') || error.message?.includes('Cancel')) {
      console.log('Photo selection cancelled by user');
    } else {
      console.error('Error picking photo from gallery:', error);
    }
    return null;
  }
};

/**
 * Verifica si la cámara está disponible
 */
export const isCameraAvailable = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Camera');
};

