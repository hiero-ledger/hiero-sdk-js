// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { type ColorValue, type OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type SFSymbolName = Extract<SymbolViewProps['name'], string>;
type IconMapping = Partial<Record<SFSymbolName, ComponentProps<typeof MaterialIcons>['name']>>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'gearshape.fill': 'settings',
  'list.bullet': 'list',
  'arrow.right.arrow.left': 'swap-horiz',
  checkmark: 'check',
  'doc.on.doc': 'content-copy',
} as const satisfies IconMapping;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // @expo/vector-icons types `color` as string | OpaqueColorValue, the tab bar passes a ColorValue.
  return <MaterialIcons color={color as string | OpaqueColorValue} size={size} name={MAPPING[name]} style={style} />;
}
