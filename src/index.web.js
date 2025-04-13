import { AppRegistry } from 'react-native';
import App from '../App';
import { name as appName } from '../app.json';
import { isWeb } from './utils/platformUtils';

// Web-specific styling to ensure the app looks good in browsers
if (isWeb) {
  // Inject global CSS for web
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #F8F9FA;
    }
    
    * {
      box-sizing: border-box;
    }
    
    #root {
      display: flex;
      flex-direction: column;
    }
    
    /* Improve scrollbar appearance on web */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    /* Disable text selection for UI elements */
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Fix for React Native Web button styling */
    button {
      cursor: pointer;
    }
    
    /* Fix for React Native Web input styling */
    input, textarea {
      outline: none;
    }
  `;
  document.head.appendChild(style);
}

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Web-specific setup
if (isWeb) {
  const rootTag = document.getElementById('root') || document.getElementById('app');
  AppRegistry.runApplication(appName, { rootTag });
}
