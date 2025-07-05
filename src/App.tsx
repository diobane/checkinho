import { useState, useCallback } from 'react';
import { Box, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { ScannerProvider } from './contexts/ScannerContext'; // Importa o Provider
import ScannerView from './components/ScannerView'; // O novo componente de UI

export function App() {
  const [tabIndex, setTabIndex] = useState('checkin');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabIndex(newValue);
  };

  const handleCheckinScan = useCallback((decodedText: string) => {
    console.log('FUNÇÃO DE CHECK-IN EXECUTADA:', decodedText);
    alert(`CHECK-IN: ${decodedText}`);
  }, []);

  const handleCheckoutScan = useCallback((decodedText: string) => {
    console.log('FUNÇÃO DE CHECK-OUT EXECUTADA:', decodedText);
    alert(`CHECK-OUT: ${decodedText}`);
  }, []);

  return (
    // Envolve tudo com o Provider
    <ScannerProvider> 
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <TabContext value={tabIndex}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleTabChange} aria-label="Checkin and out tabs" variant="fullWidth">
              <Tab label="Entrada" value="checkin" />
              <Tab label="Saída" value="checkout" />
            </TabList>
          </Box>
          <TabPanel value="checkin">
            {/* O ScannerView é ativado/desativado pelo TabPanel */}
            <ScannerView containerId="checkin-reader" onScan={handleCheckinScan} />
          </TabPanel>
          <TabPanel value="checkout">
            <ScannerView containerId="checkout-reader" onScan={handleCheckoutScan} />
          </TabPanel>
        </TabContext>
      </Box>
    </ScannerProvider>
  );
}