import { ScannerProvider } from './contexts/ScannerContext';
import ScannerControl from './components/ScannerControl';
import { CssBaseline, Container } from '@mui/material';

// O componente App principal que monta a aplicação.
// Ele usa o CssBaseline do Material-UI para normalizar estilos
// e um Container para centralizar o conteúdo.
// O mais importante é que ele envolve tudo com o ScannerProvider,
// disponibilizando o contexto do scanner para todos os componentes filhos.
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