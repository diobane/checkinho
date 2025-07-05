// src/contexts/ScannerContext.tsx

import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import React, { createContext, useContext, useRef, useState, useCallback, type ReactNode, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'checkinhoCameraLabel';

interface ScannerContextType {
  isScanning: boolean;
  cameras: CameraDevice[];
  selectedCameraLabel: string | null;
  error: string | null;
  info: string | null; // Adicionamos uma mensagem informativa
  startScanner: (containerId: string, onScanSuccess: (text: string) => void) => Promise<void>;
  stopScanner: () => Promise<void>;
  selectCamera: (label: string) => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // Estado para a mensagem informativa
  const [selectedCameraLabel, setSelectedCameraLabel] = useState<string | null>(null);

  // ✅ MUDANÇA 1: A lógica de inicialização agora fica em um useEffect.
  // Isso é mais adequado para operações assíncronas e evita re-renderizações desnecessárias.
  useEffect(() => {
    const initialize = async () => {
      try {
        const cameraList = await Html5Qrcode.getCameras();
        setCameras(cameraList);

        const savedLabel = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        // Verifica se o label salvo ainda corresponde a uma câmera disponível
        if (savedLabel && cameraList.some(c => c.label === savedLabel)) {
          setSelectedCameraLabel(savedLabel);
        } else if (cameraList.length > 0) {
          // Se não há um label salvo válido, informa o usuário para escolher uma câmera.
          setInfo("Por favor, selecione uma câmera para começar.");
        } else {
          setError("Nenhuma câmera foi encontrada.");
        }
      } catch (err) {
        setError("Não foi possível listar as câmeras. Verifique as permissões.");
      }
    };
    initialize();
  }, []); // O array vazio [] garante que isso rode apenas uma vez.

  const selectCamera = (label: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, label);
    setSelectedCameraLabel(label);
    setInfo(null); // Limpa a mensagem informativa após a seleção
  };

  const startScanner = useCallback(
    async (containerId: string, onScanSuccess: (text: string) => void) => {
      // ✅ MUDANÇA 2: Se nenhuma câmera foi selecionada, simplesmente não faz nada.
      // O usuário verá a mensagem informativa e o seletor.
      if (!selectedCameraLabel) {
        return;
      }
      
      const cameraToStart = cameras.find(c => c.label === selectedCameraLabel);

      if (!cameraToStart) {
        setError("A câmera selecionada não foi encontrada. Por favor, escolha outra.");
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setSelectedCameraLabel(null);
        return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, { verbose: false });
      }

      // Evita tentar iniciar se já estiver escaneando
      if (scannerRef.current.isScanning) {
        return;
      }

      try {
        setError(null);
        setInfo(null);
        await scannerRef.current.start(
          cameraToStart.id,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          undefined
        );
        setIsScanning(true);
      } catch (err) {
        setError("Não foi possível iniciar a câmera selecionada.");
        console.error(err);
      }
    },
    [selectedCameraLabel, cameras]
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        // Não precisa definir um erro aqui, pois é uma ação de limpeza
        console.error("Erro ao parar o scanner.", err);
      }
    }
  }, []);

  const value = {
    isScanning,
    cameras,
    selectedCameraLabel,
    error,
    info,
    startScanner,
    stopScanner,
    selectCamera,
  };

  return <ScannerContext.Provider value={value}>{children}</ScannerContext.Provider>;
};

export const useScanner = (): ScannerContextType => {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};