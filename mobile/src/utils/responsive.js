import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13/14 - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scale factor based on screen width
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

// Scale factor based on screen height
const verticalScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// Moderate scale - combines both width and height scaling
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Get responsive font size
const getResponsiveFontSize = (size) => {
  const scaled = scale(size);
  // Ensure minimum font size for readability
  if (scaled < 10) return 10;
  if (scaled > size * 1.5) return size * 1.5; // Cap maximum scaling
  return scaled;
};

// Check if device is small (width < 375)
const isSmallDevice = () => SCREEN_WIDTH < 375;

// Check if device is large (width > 414)
const isLargeDevice = () => SCREEN_WIDTH > 414;

// Get responsive padding
const getResponsivePadding = (basePadding) => {
  if (isSmallDevice()) {
    return basePadding * 0.5; // Reduce padding on small devices
  }
  if (isLargeDevice()) {
    return basePadding * 1.1; // Slightly increase padding on large devices
  }
  return basePadding * 0.75; // Reduce default padding
};

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  scale,
  verticalScale,
  moderateScale,
  getResponsiveFontSize,
  getResponsivePadding,
  isSmallDevice,
  isLargeDevice,
};

