import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import RootLayout from './components/layout/layout';
import App from './app';
import './styles/styles.scss';

const container = document.getElementById('app');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <RootLayout>
      <App />
    </RootLayout>
  </BrowserRouter>
);
