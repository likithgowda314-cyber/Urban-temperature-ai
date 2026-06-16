import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#00b96b' } }}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
