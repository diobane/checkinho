import { useEffect, useState } from 'react';
import successLogo from './assets/success.svg';
import errorLogo from './assets/error.svg';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CircularProgress } from '@mui/material';
import styles from './App.module.css';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8z7o85SIHOHNWHai02QaiQE-hwVTIxnPnhTX4wawwcj0d7tk0wM_xyAOhgMWb3RycPw/exec';

export function App() {
  const [status, setStatus] = useState('WAITING');
  const [message, setMessage] = useState('Aguardando leitura...');

  useEffect(() => {
    function onScanSuccess(decodedText: string) {
      html5QrcodeScanner.pause();

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
            html5QrcodeScanner.resume();
            setStatus('WAITING');
            setMessage('Aguardando leitura...');
          }, 3000);
        });
    }

    function onScanError(_errorMessage: string) {
      //...
    }

    const html5QrcodeScanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: 250,
    }, false);

    html5QrcodeScanner.render(onScanSuccess, onScanError);
  }, []);

  return (
    <>
      <main className={styles.container}>
        <h1></h1>
        <div id="qr-reader" className={styles.qrBox}></div>
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


  // const [count, setCount] = useState(0)

  // return (
  //   <>
  //     <div>
  //       <a href="https://vite.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.tsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p>
  //   </>
  // )
}
