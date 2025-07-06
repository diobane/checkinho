import React, { createContext, useContext, useRef, useState, useCallback, type ReactNode, useEffect } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';

const LOCAL_STORAGE_KEY = 'checkinAppCameraLabel';
const GOOGLE_SCRIPT_API_URL = 'AKfycbwspPJN_25A-5T2Dww0IlPrSaN6Bl5m-kV2IJzGXo0ba1XFFWT7l3DqWlAM6-1BQBia2g';

// --- Tipos para o contexto ---
type Mode = 'checkin' | 'checkout';

interface CheckoutState {
  step: 1 | 2;
  responsibleCode: string | null;
}

interface ScannerContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  statusCode: string;
  statusMessage: string;
  checkinResponse: CheckinResponseInterface | null;
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

const apiCheckin = (qrCode: string): Promise<CheckinResponseInterface> => {
  return fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_API_URL}/exec`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: JSON.stringify({ id: qrCode }),
  })
    .then((res) => res.json())
    .then((data) => {
      return data as CheckinResponseInterface;
    })
    .catch(() => {
      return { status: 'error', message: 'Erro ao conectar com o servidor.' };
    });
};

const apiGetChildData = (qrCode: string): Promise<CheckoutResponseInterface> => {
  return fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_API_URL}/exec?code=${qrCode}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
    .then((res) => res.json())
    .then((data) => {
      return data as CheckoutResponseInterface;
    })
    .catch((data) => {
      return { status: data.status, message: 'Erro ao conectar com o servidor.' };
    });
};

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeRef = useRef<Mode>('checkin');
  const checkoutRef = useRef<CheckoutState>({ step: 1, responsibleCode: null });

  const [mode, setModeState] = useState<Mode>('checkin');
  const [statusMessage, setStatusMessage] = useState('Aguardando leitura...');
  const [statusCode, setStatusCode] = useState('WAITING_READING');
  const [checkinResponse, setCheckinResponse] = useState<CheckinResponseInterface | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraLabel, setSelectedCameraLabel] = useState<string | null>(null);
  

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
        setStatusCode('GENERIC_ERROR');
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
    checkoutRef.current = { step: 1, responsibleCode: null }; // Reseta o fluxo de checkout
    setStatusMessage('Aguardando leitura...');
    setStatusCode('WAITING_READING');
    setIsProcessing(false);
  };

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
    setStatusMessage('Registrando presença para ID: ' + qrCode);
    setStatusCode('CALLING_API');
    const response = await apiCheckin(qrCode);
    setCheckinResponse(response);
    setStatusMessage(response.message);
    if (response.status === 'success') {
      setStatusCode('CHECKIN_SUCCESS');
    } else {
      setStatusCode('ERROR');
    }
    resetAfterDelay(4000);
  };

  const handleCheckoutFlow = async (qrCode: string) => {
    if (checkoutRef.current.step === 1) {
      // Primeiro passo: ler o QR da criança

      setStatusMessage('Buscando informações para ID: ' + qrCode);
      setStatusCode('CALLING_API');
      const response = await apiGetChildData(qrCode);

      if (response.status === 'success' && response.content) {
        const readerlabel = !qrCode.startsWith('R') ? 'do responsável' : 'da criança';
        checkoutRef.current = { step: 2, responsibleCode: response.content.responsibleCode };
        setStatusMessage('Aguardando leitura ' + readerlabel);
        setStatusCode('WAITING_READING');
        setIsProcessing(false);
        if (scannerRef.current) scannerRef.current.resume();
      } else {
        setStatusMessage('Não há nenhuma criança ou responsável para esse ID.');
        setStatusCode('ERROR');
        resetAfterDelay();
      }
    } else {
      // Segundo passo: ler o QR do responsável

      if (qrCode === checkoutRef.current.responsibleCode) {
        setStatusMessage('Checkout realizado com sucesso!');
        setStatusCode('CHECKOUT_SUCCESS');
      } else {
        setStatusMessage('Este não é o responsável da criança!');
        setStatusCode('ERROR');
      }
      resetAfterDelay();
    }
  };

  // Reseta o estado para o inicial após um tempo
  const resetAfterDelay = (delay = 3000) => {
    timeoutRef.current = setTimeout(() => {
      checkoutRef.current = { step: 1, responsibleCode: null };
      setStatusMessage('Aguardando leitura...');
      setStatusCode('WAITING_READING');
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
      setStatusCode('GENERIC_ERROR');
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
        setStatusCode('GENERIC_ERROR');
    });

  }, [selectedCameraLabel, cameras]); // A função é recriada se a câmera mudar

  const value = {
    mode,
    setMode,
    statusCode,
    statusMessage,
    checkinResponse,
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