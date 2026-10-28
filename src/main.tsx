import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ChatProvider } from './chat/ChatProvider'
import { AuthProvider } from './auth/AuthProvider'
import './styles/tokens.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ChatProvider outside AuthProvider: sign-out clears the transcript,
        so the session needs to reach the chat, not the other way round. */}
    <ChatProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ChatProvider>
  </StrictMode>,
)
