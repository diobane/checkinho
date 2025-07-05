import { type SelectChangeEvent, FormControl, InputLabel, Select, MenuItem, CircularProgress, Button } from "@mui/material";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { useEffect, useMemo, useState, useRef } from "react";
import styles from './Checkout.module.css';
import successLogo from '../../assets/success.svg';
import errorLogo from '../../assets/error.svg';
import type { CheckoutResponseInterface } from "../../models/CheckoutResponseInterface";

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwE6JX4ysIWPHCxH55wiETeHFDDM-bwo8zImXDvLfbNuVx93r0JQ-OiWNp2oST__cIjjA/exec';

export function Checkout() {
  const [status, setStatus] = useState('NONE');
  const [message, setMessage] = useState('Aguardando leitura...');
  const [cameras, setCameras] = useState<Array<CameraDevice>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [pairInfo, setPairInfo] = useState<CheckoutResponseInterface | null>(null);

  // const [html5Qrcode, setHtml5Qrcode] = useState<Html5Qrcode | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrCodeScanner = new Html5Qrcode('qr-reader-checkout');
    html5QrCodeRef.current = qrCodeScanner;
  }, []);

  useEffect(() => {
    // Se o status indica que devemos esperar por uma leitura...
    if (status === 'WAITING' || status === 'NEXT_READING') {
      try {
        // Verifica se o scanner está pausado (estado 3) antes de resumir
        if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === 3) {
          html5QrCodeRef.current.resume();
        }
      } catch (e) {
        // Pode dar erro se o scanner ainda não foi iniciado, é seguro ignorar.
        console.log("Scanner não iniciado, não é possível resumir.");
      }
    }
  }, [status, html5QrCodeRef]); // Executa toda vez que 'status' ou 'html5Qrcode' mudar

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras && cameras.length === 1) {
          buildQrCodeScanner(cameras[0].id);
        } else if (cameras && cameras.length > 0) {
          setCameras(cameras);
        } else {
          console.error('No cameras found.');
        }
      })
      .catch((err) => {
        console.error('Error fetching cameras:', err);
      });
  }, []);

  const buildQrCodeScanner = (selectedCameraId: string) => {
    function onScanSuccess(decodedText: string) {
      html5QrCodeRef.current?.pause();
      setStatus('SEARCHING');
      setMessage(`Buscando informações para ID: ${decodedText}`);

      if (pairInfo != null) {
        ////////////////Adicionar lógica para a situação de ler a criança duas vezes ou o responsável duas vezes.
        if (decodedText === pairInfo.childId.toString() || decodedText === pairInfo.responsibleCode) {
          setPairInfo(null);
          setStatus('SUCCESS');
          setMessage('Checkout realizado com o responsável correto!');
        } else {
          setPairInfo(null);
          setStatus('INVALID_PAIR');
          setMessage('Este responsável não está relacionado a essa criança!');
        }
        setTimeout(() => {
          //html5Qrcode.resume();
          setStatus('WAITING');
          setMessage('Aguardando leitura...');
        }, 3000);
      } else {
        fetch(`${SCRIPT_URL}?code=${decodedText}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.status !== 'success') {
            setMessage(data.message);
            setStatus('ERROR');
          } else {
            setPairInfo(data.content);
            const readerlabel = !decodedText.startsWith('R') ? 'do responsável' : 'da criança';
            setMessage('Aguardando leitura ' + readerlabel);
            setStatus('NEXT_READING');
          }
        })
        .catch(() => {
          setStatus('ERROR');
          setMessage('Erro ao conectar com o servidor.');
        })
        .finally(() => {
          //html5Qrcode.resume();
          if (status === 'ERROR') {
            setTimeout(() => {
              setStatus('WAITING');
              setMessage('Aguardando leitura...');
            }, 3000);
          }
        });
      }
    }

    function onScanError(_errorMessage: string) {
      //...
    }

    html5QrCodeRef.current?.start(selectedCameraId, { fps: 10, qrbox: 250 }, onScanSuccess, onScanError);
    setStatus('WAITING');
  }

  const handleSelectCamera = (event: SelectChangeEvent) => {
    setSelectedCameraId(event.target.value as string);
    setCameras([]);
    buildQrCodeScanner(event.target.value);
  };

  const resetFirstReading = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPairInfo(null);
    setStatus('WAITING');
    setMessage('Aguardando leitura...');
  }

  return (
    <>
      <main className={styles.container}>
        <div id="qr-reader-checkout" className={styles.qrBox}></div>

        { cameras.length > 0 &&
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
                {cameras.map((camera: CameraDevice, index: number) => (
                  <MenuItem key={index} value={camera.id}>
                    {camera.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        }
        
        <div id="result" className={styles.result}>
          { status === "WAITING" && 
            <div className={styles.waiting}>
              <span>{ message }</span>
            </div>
          }

          { status === "SEARCHING" && 
            <div className={styles.searching}>
              <CircularProgress thickness={5} color='inherit' size={50}/>
              <span>{ message }</span>
            </div>
          }

          { status === "NEXT_READING" && 
            <div className={styles.searching}>
              <CircularProgress thickness={5} color='inherit' size={50}/>
              <span>{ message }</span>
              <Button variant="outlined" onClick={(e) => resetFirstReading(e)}>Cancelar</Button>
            </div>
          }

          { status === "SUCCESS" && 
            <div className={styles.success}>
              <img src={successLogo} alt="Success logo" />
              <span>{ message }</span>
            </div>
          }

          { (status === "INVALID_PAIR" || status === "ERROR") && 
            <div className={styles.error}>
              <img src={errorLogo} alt="Error logo" />
              <span>{ message }</span>
            </div>
          }
        </div>
      </main>
    </>
  );
}

// Removed incorrect implementation of useRef
