// NOTE: React Native / Expo apps must polyfill `crypto.getRandomValues`
// themselves by importing `react-native-get-random-values` at the app root
// before importing the SDK.
global.process.nextTick = setImmediate;
