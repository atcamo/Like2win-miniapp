"use client";

import { useEffect, useState } from "react";
import { useMiniKit, useAddFrame } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

export function useMiniKitSetup() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { isConnected } = useAccount();
  const addFrame = useAddFrame();
  const [frameAdded, setFrameAdded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Inicializar frame y llamar ready
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    } else {
      setIsReady(true);
      
      // Llamar sdk.actions.ready() para señalar que la app está lista
      if (typeof window !== 'undefined' && (window as any).sdk?.actions?.ready) {
        try {
          (window as any).sdk.actions.ready();
          console.log('SDK ready called successfully');
        } catch (error) {
          console.error('Error calling sdk.actions.ready:', error);
        }
      }
    }
  }, [isFrameReady, setFrameReady]);

  // Función para agregar frame
  const handleAddFrame = async () => {
    try {
      const result = await addFrame();
      setFrameAdded(Boolean(result));
      return result;
    } catch (error) {
      console.error("Error adding frame:", error);
      return false;
    }
  };

  // Estado del frame
  const frameStatus = {
    isReady,
    isConnected,
    canAddFrame: context && !context.client.added,
    isFrameAdded: frameAdded || (context?.client.added ?? false),
  };

  return {
    ...frameStatus,
    handleAddFrame,
    context,
  };
}