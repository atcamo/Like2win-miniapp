"use client";

import { useEffect, useRef } from 'react';

export function FarcasterSDKInit() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initialization calls
    if (initializedRef.current) {
      return;
    }

    const initializeSDK = async () => {
      try {
        if (typeof window !== 'undefined') {
          const { sdk } = await import('@farcaster/frame-sdk');
          
          console.log('Initializing Farcaster SDK...');
          
          if (sdk?.actions?.ready) {
            try {
              await sdk.actions.ready();
              console.log('✅ Farcaster SDK ready() called successfully');
              initializedRef.current = true;
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

    initializeSDK();
  }, []);

  return null;
}