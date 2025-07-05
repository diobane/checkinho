// src/components/ScannerView.tsx
import React, { useEffect } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { FormControl, InputLabel, MenuItem, Select, CircularProgress, Box, Typography } from '@mui/material';

interface ScannerViewProps {
  containerId: string;
  onScan: (decodedText: string) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ containerId, onScan }) => {
    const { 
      startScanner, 
      stopScanner, 
      cameras, 
      selectedCameraLabel, 
      selectCamera, 
      isScanning, 
      error,
      info // Pega a nova mensagem do contexto
    } = useScanner();
  
    useEffect(() => {
      startScanner(containerId, onScan);
      return () => {
        stopScanner();
      };
    }, [containerId, onScan, startScanner, stopScanner]);
  
    return (
      <div>
        <div id={containerId} style={{ width: '100%', minHeight: '250px', backgroundColor: '#eee' }} />
  
        <FormControl fullWidth margin="normal">
          <InputLabel id="camera-select-label">Câmera</InputLabel>
          <Select
            labelId="camera-select-label"
            value={selectedCameraLabel || ''}
            onChange={(e) => selectCamera(e.target.value)}
            disabled={isScanning || cameras.length === 0}
          >
            {cameras.map((camera) => (
              <MenuItem key={camera.label} value={camera.label}>
                {camera.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
  
        {/* ✅ Exibe as mensagens de status */}
        <Box mt={2}>
          {isScanning && (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={24} />
              <Typography variant="body2">Scanner ativo...</Typography>
            </Box>
          )}
          {info && !isScanning && (
            <Typography variant="body2" color="text.secondary">{info}</Typography>
          )}
          {error && (
            <Typography variant="body2" color="error">{error}</Typography>
          )}
        </Box>
      </div>
    );
  };
  
  export default ScannerView;