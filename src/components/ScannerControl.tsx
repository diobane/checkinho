import React, { useEffect } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import type { CameraDevice } from 'html5-qrcode';
import successLogo from '../assets/success.svg';
import errorLogo from '../assets/error.svg';

const SCANNER_CONTAINER_ID = 'qr-scanner-container';

export default function ScannerControl() {
  const {
    mode,
    setMode,
    statusCode,
    statusMessage,
    checkinResponse,
    cameras,
    selectedCameraLabel,
    selectCamera,
    startScannerWithSelectedCamera,
  } = useScanner();

  // Efeito que inicia o scanner quando uma câmera é selecionada
  useEffect(() => {
    if (selectedCameraLabel) {
      startScannerWithSelectedCamera(SCANNER_CONTAINER_ID);
    }
  }, [selectedCameraLabel, startScannerWithSelectedCamera]);

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'checkin' | 'checkout' | null) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      
      {/* Botões de seleção de modo */}
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        aria-label="Modo de operação"
        fullWidth
      >
        <ToggleButton value="checkin" color="primary">
          ENTRADA
        </ToggleButton>
        <ToggleButton value="checkout" color="primary">
          SAÍDA
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Área do Scanner */}
      <Box
        id={SCANNER_CONTAINER_ID}
        sx={{
          width: '90%',
          maxWidth: '350px',
          border: selectedCameraLabel ? '2px solid white !important' : 'none'
        }}
      >
        {!selectedCameraLabel && cameras.length > 0 && (
          <Box sx={{ margin: '24px 0' }}>
            <FormControl fullWidth>
              <InputLabel id="camera-select-label">Selecione a câmera</InputLabel>
              <Select
                labelId="camera-select-label"
                id="camera-select"
                label="Seleciona a câmera"
                onChange={(event: SelectChangeEvent) => selectCamera(event.target.value as string)}
              >
                {cameras.map((camera: CameraDevice) => (
                  <MenuItem key={camera.id} value={camera.label}>
                    {camera.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Label de Status */}
      {selectedCameraLabel && (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={40} gap={1}>
          <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                marginTop: '28px',
                fontSize: 'larger',
                fontWeight: '700',
              }}>
            { statusCode === "WAITING_READING" && 
                <Typography variant="h6" component="p" textAlign="center">
                  {statusMessage}
                </Typography>
            }

            { statusCode === "CALLING_API" && 
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                marginTop: '28px',
                fontSize: 'larger',
                fontWeight: '700',
                color: '#3F5BA1',
                textAlign: 'center'
              }}>
                <CircularProgress thickness={5} color='inherit' size={50}/>
                <Typography variant="h6" component="p" textAlign="center">
                  {statusMessage}
                </Typography>
              </Box>
            }

            { statusCode === "CHECKIN_SUCCESS" && 
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                marginTop: '28px',
                fontSize: 'larger',
                fontWeight: '700',
                color: '#5DA277',
                textAlign: 'center'
              }}>
                <img src={successLogo} alt="Success logo"/>
                <Typography variant="h6" component="p" textAlign="center">
                  {statusMessage}
                </Typography>
                <Typography variant="h6" component="p" textAlign="center">
                  Time: {checkinResponse?.team}
                </Typography>
              </Box>
            }

            { statusCode === "ERROR" && 
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                marginTop: '28px',
                fontSize: 'larger',
                fontWeight: '700',
                color: '#93344A',
                textAlign: 'center'
              }}>
                <img src={errorLogo} alt="Error logo"/>
                <Typography variant="h6" component="p" textAlign="center">
                  {statusMessage}
                </Typography>
              </Box>
            }

            { statusCode === "CHECKOUT_SUCCESS" && 
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                marginTop: '28px',
                fontSize: 'larger',
                fontWeight: '700',
                color: '#5DA277',
                textAlign: 'center'
              }}>
                <img src={successLogo} alt="Success logo"/>
                <Typography variant="h6" component="p" textAlign="center">
                  {statusMessage}
                </Typography>
              </Box>
            }

            { statusCode === "GENERIC_ERROR" && 
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                marginTop: '28px',
                fontSize: 'larger',
                fontWeight: '700',
                color: '#93344A',
                textAlign: 'center'
              }}>
                <Typography variant="h6" component="p" textAlign="center">
                  {statusMessage}
                </Typography>
              </Box>
            }
          </Box>
        </Box>
      )}
    </Box>
  );
}
