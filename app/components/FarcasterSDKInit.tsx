"use client";

import { useEffect } from 'react';

export function FarcasterSDKInit() {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Verificar si estamos en el entorno de Farcaster
        if (typeof window !== 'undefined') {
          // Importación dinámica para evitar errores en SSR
          const { sdk } = await import('@farcaster/frame-sdk');
          
          console.log('Initializing Farcaster SDK...');
          
          // Llamar ready() inmediatamente
          if (sdk?.actions?.ready) {
            try {
              await sdk.actions.ready();
              console.log('✅ Farcaster SDK ready() called successfully');
            } catch (readyError) {
              console.error('❌ Error calling SDK ready():', readyError);
            }
          } else {
            console.warn('⚠️ SDK actions.ready() not available');
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize Farcaster SDK:', error);
      }
    };

    // Llamar inmediatamente al cargar
    initializeSDK();
  }, []);

  return null; // Este componente no renderiza nada
}