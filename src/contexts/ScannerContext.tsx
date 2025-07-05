import React, { createContext, useContext, useRef, useState, useCallback, type ReactNode, useEffect } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';

const LOCAL_STORAGE_KEY = 'checkinAppCameraLabel';
const GOOGLE_SCRIPT_API_URL = 'AKfycbwE6JX4ysIWPHCxH55wiETeHFDDM-bwo8zImXDvLfbNuVx93r0JQ-OiWNp2oST__cIjjA';

// --- Tipos para o contexto ---
type Mode = 'checkin' | 'checkout';

interface CheckoutState {
  step: 1 | 2;
  responsibleCode: string | null;
}

interface ScannerContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  statusMessage: string;
  checkinResponse: CheckinResponseInterface | null;
  checkoutResponse: CheckoutResponseInterface | null;
  isProcessing: boolean;
  cameras: CameraDevice[];
  selectedCameraLabel: string | null;
  selectCamera: (label: string) => void;
  startScannerWithSelectedCamera: (containerId: string) => void;
}

interface CheckinResponseInterface {
    status: string;
    message: string;
    team?: string;
}

interface CheckoutResponseInterface {
    status: string;
    content?: CheckoutResponseContentInterface;
    message?: string;
}

interface CheckoutResponseContentInterface {
    childId: number;
    childName: string;
    responsibleCode: string;
    responsibleName: string;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

// Chama API de check-in
const apiCheckin = (qrCode: string): Promise<CheckinResponseInterface> => {
  console.log(`API CHECKIN chamada com: ${qrCode}`);
  return fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_API_URL}/exec`, {                                                                                
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: JSON.stringify({ id: qrCode }),
  })
    .then((res) => res.json())
    .then((data) => {
      return { status: data.status, message: data.message, team: data.team };
    })
    .catch(() => {
      return { status: 'error', message: 'Erro ao conectar com o servidor.' };
    });
};

// Chama API de busca para o check-out
const apiGetChildData = (childQrCode: string): Promise<{ status: string; content?: { childId: string; responsibleCode: string } }> => {
  console.log(`API GET_CHILD_DATA chamada com: ${childQrCode}`);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        status: 'success',
        content: {
          childId: childQrCode,
          responsibleCode: `RESP_${childQrCode}` // Gera um código de responsável previsível para teste
        }
      });
    }, 1000);
  });
};


// --- O Componente Provider ---

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeRef = useRef<Mode>('checkin');

  const [mode, setModeState] = useState<Mode>('checkin');
  const [statusMessage, setStatusMessage] = useState('Aguardando leitura...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraLabel, setSelectedCameraLabel] = useState<string | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ step: 1, responsibleCode: null });

  // Busca as câmeras disponíveis e a preferência salva ao iniciar
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        setCameras(devices);
        const savedLabel = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedLabel && devices.some(d => d.label === savedLabel)) {
          setSelectedCameraLabel(savedLabel);
        }
      })
      .catch(err => {
        console.error('Erro ao buscar câmeras:', err);
        setStatusMessage('Erro ao acessar câmeras. Verifique as permissões.');
      });
  }, []);

  // Limpa o estado e timers ao trocar de modo (ENTRADA/SAÍDA)
  const setMode = (newMode: Mode) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current); // Cancela qualquer timer pendente
    if (isProcessing && scannerRef.current) {
        try {
            scannerRef.current.resume();
        } catch (e) {
            console.error("Não foi possível resumir o scanner na troca de modo:", e);
        }
    }
    modeRef.current = newMode;
    setModeState(newMode);
    setCheckoutState({ step: 1, responsibleCode: null }); // Reseta o fluxo de checkout
    setStatusMessage('Aguardando leitura...');
    setIsProcessing(false);
  };

  // Função chamada no sucesso da leitura do QR Code
  const onScanSuccess = (decodedText: string) => {
    if (scannerRef.current) scannerRef.current.pause();
    setIsProcessing(true);

    if (modeRef.current === 'checkin') {
      handleCheckinFlow(decodedText);
    } else {
      handleCheckoutFlow(decodedText);
    }
  };

  const handleCheckinFlow = async (qrCode: string) => {
    setStatusMessage('Registrando presença...');
    const response = await apiCheckin(qrCode);
    setStatusMessage(response.message);
    resetAfterDelay();
  };

  const handleCheckoutFlow = async (qrCode: string) => {
    if (checkoutState.step === 1) {
      // Primeiro passo: ler o QR da criança
      setStatusMessage('Buscando dados da criança...');
      const response = await apiGetChildData(qrCode);
      if (response.status === 'success' && response.content) {
        setCheckoutState({ step: 2, responsibleCode: response.content.responsibleCode });
        setStatusMessage('Aguardando leitura do responsável...');
        setIsProcessing(false);
        if (scannerRef.current) scannerRef.current.resume();
      } else {
        setStatusMessage('Criança não encontrada.');
        resetAfterDelay();
      }
    } else {
      // Segundo passo: ler o QR do responsável
      setStatusMessage('Verificando responsável...');
      if (qrCode === checkoutState.responsibleCode) {
        setStatusMessage('Checkout realizado com sucesso!');
      } else {
        setStatusMessage('Este não é o responsável da criança!');
      }
      resetAfterDelay();
    }
  };

  // Reseta o estado para o inicial após um tempo
  const resetAfterDelay = (delay = 3000) => {
    timeoutRef.current = setTimeout(() => {
      setCheckoutState({ step: 1, responsibleCode: null });
      setStatusMessage('Aguardando leitura...');
      setIsProcessing(false);
      if (scannerRef.current?.getState() === 3) {
        scannerRef.current.resume();
      }
    }, delay);
  };

  // Função para o usuário selecionar a câmera pela primeira vez
  const selectCamera = (label: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, label);
    setSelectedCameraLabel(label);
  };

  // Inicia o scanner com a câmera selecionada
  const startScannerWithSelectedCamera = useCallback((containerId: string) => {
    if (!selectedCameraLabel) return;

    const camera = cameras.find(c => c.label === selectedCameraLabel);
    if (!camera) {
        setStatusMessage("Câmera salva não encontrada.");
        return;
    }

    // Cria a instância única do scanner
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
        camera.id,
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        undefined
    ).catch(err => {
        console.error("Não foi possível iniciar o scanner", err);
        setStatusMessage("Erro ao iniciar a câmera.");
    });

  }, [selectedCameraLabel, cameras]); // A função é recriada se a câmera mudar

  const value = {
    mode,
    setMode,
    statusMessage,
    isProcessing,
    cameras,
    selectedCameraLabel,
    selectCamera,
    startScannerWithSelectedCamera,
  };

  return <ScannerContext.Provider value={value}>{children}</ScannerContext.Provider>;
};

// Hook customizado para facilitar o uso do contexto
export const useScanner = (): ScannerContextType => {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScanner deve ser usado dentro de um ScannerProvider');
  }
  return context;
};