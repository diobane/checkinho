import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import styles from './QrScanner.module.css';
import FormControl from '@mui/material/FormControl';
import { InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';

interface QrScannerProps {
  containerId: string;
  onScan: (decodedText: string) => void;
}

const LOCAL_STORAGE_KEY = 'checkinhoCameraLabel'; 

// ✅ PASSO 1: Função helper para criar um delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const QrScanner: React.FC<QrScannerProps> = ({ containerId, onScan }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<Array<CameraDevice>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(containerId, { verbose: false });
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      // ✅ PASSO 2: Adiciona o delay antes de qualquer outra coisa
      // Dá tempo para o navegador liberar a câmera da aba anterior.
      await delay(1500);

      setError(null);
      try {
        const availableCameras = await Html5Qrcode.getCameras();
        if (!availableCameras || availableCameras.length === 0) {
          setError("Nenhuma câmera foi encontrada.");
          return;
        }

        const savedCameraLabel = localStorage.getItem(LOCAL_STORAGE_KEY);
        let cameraToStart: CameraDevice | undefined = undefined;

        if (savedCameraLabel) {
          cameraToStart = availableCameras.find(c => c.label === savedCameraLabel);
        }

        if (cameraToStart) {
          setSelectedCameraId(cameraToStart.id);
          await html5QrCode.start(cameraToStart.id, { fps: 10, qrbox: { width: 250, height: 250 } }, onScan, undefined);
        } else if (availableCameras.length === 1) {
          cameraToStart = availableCameras[0];
          localStorage.setItem(LOCAL_STORAGE_KEY, cameraToStart.label);
          setSelectedCameraId(cameraToStart.id);
          await html5QrCode.start(cameraToStart.id, { fps: 10, qrbox: { width: 250, height: 250 } }, onScan, undefined);
        } else {
          setCameras(availableCameras);
        }
      } catch (err: any) {
        console.error("Erro ao inicializar o scanner:", err);
        setError("Não foi possível iniciar a câmera. Verifique as permissões.");
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {
          console.error("Falha ao parar o scanner.", err);
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  // A função handleSelectCamera não precisa de alterações
  const handleSelectCamera = async (event: SelectChangeEvent) => {
    const newCameraId = event.target.value as string;
    const selectedCamera = cameras.find(c => c.id === newCameraId);
    if (!selectedCamera) return;

    localStorage.setItem(LOCAL_STORAGE_KEY, selectedCamera.label);
    setSelectedCameraId(newCameraId);
    setCameras([]);

    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.start(newCameraId, { fps: 10, qrbox: { width: 250, height: 250 } }, onScan, undefined);
        setError(null);
      } catch (err) {
        console.error("Erro ao trocar de câmera:", err);
        setError("Não foi possível iniciar a câmera selecionada.");
      }
    }
  };

  return (
    <>
      <div id={containerId} className={styles.qrContainer} />
      {cameras.length > 0 && (
        <div className={styles.cameraSelector}>
          <FormControl fullWidth>
            <InputLabel id="camera-select-label">Selecione a câmera</InputLabel>
            <Select
              labelId="camera-select-label"
              id="camera-select"
              value={selectedCameraId}
              label="Seleciona a câmera"
              onChange={handleSelectCamera}
            >
              {cameras.map((camera) => (
                <MenuItem key={camera.id} value={camera.id}>
                  {camera.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
    </>
  );
};

export default QrScanner;