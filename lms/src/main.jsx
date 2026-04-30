import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { I18nProvider } from './i18n/index.jsx';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fee2e2', minHeight: '100vh' }}>
          <h2 style={{ color: '#991b1b', marginBottom: 16 }}>App crashed — error details:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#7f1d1d', fontSize: 13 }}>
            {this.state.error.toString()}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
