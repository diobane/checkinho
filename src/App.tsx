import { ScannerProvider } from './contexts/ScannerContext';
import ScannerControl from './components/ScannerControl';
import { CssBaseline, Container } from '@mui/material';

export function App() {
  return (
    <ScannerProvider>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <ScannerControl />
      </Container>
    </ScannerProvider>
  );
}