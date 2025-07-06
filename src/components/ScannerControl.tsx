import React, { useEffect } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent, Dialog, DialogContent, DialogContentText } from '@mui/material';
import type { CameraDevice } from 'html5-qrcode';
import successLogo from '../assets/success.svg';
import errorLogo from '../assets/error.svg';

const SCANNER_CONTAINER_ID = 'qr-scanner-container';

interface TeamColorInterface {
  primary: string; 
  secondary: string;
  label: string;
}

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
    event.preventDefault();
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  const getTeamInfo = (team: string | undefined): TeamColorInterface  => {
    switch (team) {
      case 'VERMELHO':
        return { primary: '#FF3131', secondary: '#FFFFFF', label: 'CAVALO MARINHO' };
      case 'AMARELO':
        return { primary: '#FFE635', secondary: '#000000', label: 'ESTRELA DO MAR' };
      case 'VERDE':
        return { primary: '#40DD33', secondary: '#000000', label: 'TARTARUGA MARINHA' };
      case 'AZUL':
        return { primary: '#00AACF', secondary: '#FFFFFF', label: 'GOLFINHO' };
      case 'ANIL':
        return { primary: '#3B2D8F', secondary: '#FFFFFF', label: 'POLVO' };
      default:
        return { primary: '#A3A3A3', secondary: '#000000', label: 'SEM EQUIPE' };
    }
  }

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
              <Dialog
              open={statusCode === "CALLING_API" ? true : false}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              >
                <DialogContent>
                  <DialogContentText id="alert-dialog-description" sx={{
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
                  </DialogContentText>
                </DialogContent>
              </Dialog>
            }

            { statusCode === "CHECKIN_SUCCESS" && 
              <Dialog
                open={statusCode === "CHECKIN_SUCCESS" ? true : false}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogContent>
                  <DialogContentText id="alert-dialog-description" sx={{
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
                      Presença registrada de:
                    </Typography>
                    <Typography variant="h6" component="p" sx={{ 
                      color: '#000000', 
                      fontWeight: 'bold' 
                    }}> 
                      {statusMessage}
                    </Typography>
                    <Typography component="p" sx={{
                      fontSize: 'large',
                      fontWeight: '700',
                      color: '#000000',
                      textAlign: 'center'
                    }}>
                      Equipe:
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: 'larger',
                      fontWeight: '500',
                      color: getTeamInfo(checkinResponse?.team).secondary,
                      textAlign: 'center',
                      backgroundColor: getTeamInfo(checkinResponse?.team).primary,
                      padding: '10px 15px',
                      borderRadius: '8px',
                      width: '100%'
                    }}>
                      {getTeamInfo(checkinResponse?.team).label}
                    </Box>
                  </DialogContentText>
                </DialogContent>
              </Dialog>
            }

            { statusCode === "CHECKOUT_SUCCESS" && 
              <Dialog
              open={statusCode === "CHECKOUT_SUCCESS" ? true : false}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              >
                <DialogContent>
                  <DialogContentText id="alert-dialog-description" sx={{
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
                  </DialogContentText>
                </DialogContent>
              </Dialog>
            }
            
            { statusCode === "ERROR" && 
              <Dialog
              open={statusCode === "ERROR" ? true : false}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              >
                <DialogContent>
                  <DialogContentText id="alert-dialog-description" sx={{
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
                  </DialogContentText>
                </DialogContent>
              </Dialog>
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
