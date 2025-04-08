import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0073BB', // AWS blue
    accent: '#FF9900', // AWS orange
    background: '#F8F8F8',
    surface: '#FFFFFF',
    text: '#232F3E', // AWS dark blue/gray
    error: '#D13212', // AWS red
    success: '#1D8102', // AWS green
    info: '#0073BB',
    warning: '#FF9900',
  },
  roundness: 8,
};
