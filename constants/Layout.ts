import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const LAYOUT = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
} as const;
