"use client";

import React from 'react';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-2xl p-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            🎲 Like2Win
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            ¡Tu mini app de rifas está funcionando!
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">
                🔐 Autenticación
              </h3>
              <p className="text-gray-600">
                Conecta tu wallet y auténticate con Farcaster
              </p>
            </div>
            
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="text-xl font-semibold text-green-800 mb-4">
                🎫 Participación
              </h3>
              <p className="text-gray-600">
                Participa en rifas con likes, comentarios y recasts
              </p>
            </div>
            
            <div className="p-6 bg-purple-50 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">
                🏆 Leaderboard
              </h3>
              <p className="text-gray-600">
                Compite con otros usuarios por premios
              </p>
            </div>
            
            <div className="p-6 bg-yellow-50 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-800 mb-4">
                🖼️ Frames
              </h3>
              <p className="text-gray-600">
                Interactúa con frames directamente en Farcaster
              </p>
            </div>
          </div>
          
          <div className="mt-12">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Comenzar Demo
            </button>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Status: ✅ Servidor funcionando correctamente</p>
            <p>Puerto: 8080</p>
            <p>Entorno: Desarrollo</p>
          </div>
        </div>
      </div>
    </div>
  );
}