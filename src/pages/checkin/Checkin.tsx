import { type SelectChangeEvent, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { useEffect, useMemo, useState } from "react";
import styles from './Checkin.module.css';
import successLogo from '../../assets/success.svg';
import errorLogo from '../../assets/error.svg';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJuf6IhveLHs5tDlq5py5sFaYNb464tub9f2iSNFoiq3yxh9twV6G0WP6Rep_Ia3T7ig/exec';

export function Checkin() {
  const [status, setStatus] = useState('NONE');
  const [message, setMessage] = useState('Aguardando leitura...');
  const [cameras, setCameras] = useState<Array<CameraDevice>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

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
      html5Qrcode.pause();

      setStatus('REGISTERING');
      setMessage(`Registrando presença para ID: ${decodedText}`);

      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: JSON.stringify({ id: decodedText }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMessage(data.message);
          setStatus(data.status === 'success' ? 'SUCCESS' : 'ERROR');
        })
        .catch(() => {
          setStatus('ERROR');
          setMessage('Erro ao conectar com o servidor.');
        })
        .finally(() => {
          setTimeout(() => {
            html5Qrcode.resume();
            setStatus('WAITING');
            setMessage('Aguardando leitura...');
          }, 3000);
        });
    }

    function onScanError(_errorMessage: string) {
      //...
    }

    const html5Qrcode = new Html5Qrcode('qr-reader-checkin');
    html5Qrcode.start(selectedCameraId, { fps: 10, qrbox: 250 }, onScanSuccess, onScanError);
    setStatus('WAITING');
  }

  const handleSelectCamera = (event: SelectChangeEvent) => {
    setSelectedCameraId(event.target.value as string);
    setCameras([]);
    buildQrCodeScanner(event.target.value);
  };

  return (
    <>
      <main className={styles.container}>
        <div id="qr-reader-checkin" className={styles.qrBox}></div>

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

          { status === "REGISTERING" && 
            <div className={styles.registering}>
              <CircularProgress thickness={5} color='inherit' size={50}/>
              <span>{ message }</span>
            </div>
          }

          { status === "SUCCESS" && 
            <div className={styles.success}>
              <img src={successLogo} alt="Success logo" />
              <span>{ message }</span>
            </div>
          }

          { status === "ERROR" && 
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