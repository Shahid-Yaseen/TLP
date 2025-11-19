import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const RedDotLoader = ({ 
  size = 'medium', 
  fullScreen = false,
  style 
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      dotSize: 8,
      gap: 6
    },
    medium: {
      dotSize: 12,
      gap: 8
    },
    large: {
      dotSize: 16,
      gap: 10
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const dot1 = useRef(new Animated.Value(0.5)).current;
  const dot2 = useRef(new Animated.Value(0.5)).current;
  const dot3 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const createAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 200);
    const anim3 = createAnimation(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const scale1 = dot1.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.8, 1],
  });

  const opacity1 = dot1.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.5, 1],
  });

  const scale2 = dot2.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.8, 1],
  });

  const opacity2 = dot2.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.5, 1],
  });

  const scale3 = dot3.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.8, 1],
  });

  const opacity3 = dot3.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.5, 1],
  });

  const containerStyle = fullScreen
    ? [styles.container, styles.fullScreen, style]
    : [styles.container, style];

  return (
    <View style={containerStyle} accessibilityLabel="Loading">
      <View style={[styles.dotsContainer, { gap: config.gap }]}>
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              transform: [{ scale: scale1 }],
              opacity: opacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              transform: [{ scale: scale2 }],
              opacity: opacity2,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              transform: [{ scale: scale3 }],
              opacity: opacity3,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: theme.colors.primary, // #8B1A1A
  },
});

export default RedDotLoader;

