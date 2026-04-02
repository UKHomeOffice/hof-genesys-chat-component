import { Routes, Route } from 'react-router';
import NotFound from './routes/not-found';
import EndChatConfirmation from './components/chat/end-chat-confirmation';
import { ErrorBoundary } from './error/error-boundary';
import Cookies from './components/cookies/cookies';
import Sandbox from './routes';

export default function App() {
  return (
    <ErrorBoundary contactFormLink="#">
      <Routes>
        <Route path="/" element={<Sandbox />} />
        <Route path="/cookies" element={<Cookies />} />        
        <Route path="/end-chat-confirmation" element={<EndChatConfirmation/>} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
