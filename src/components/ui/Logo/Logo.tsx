import { Image } from 'expo-image';
import type { ComponentPropsWithRef } from 'react';

import { logos, type LogoVariant } from '@/constants/logos';

export type LogoProps = Omit<
  ComponentPropsWithRef<typeof Image>,
  'source' | 'contentFit' | 'tintColor'
> & {
  variant?: LogoVariant;
};

const Logo = ({
  variant = 'full',
  style,
  accessibilityLabel = 'ab.',
  accessible = true,
  ...props
}: LogoProps) => {
  const logo = logos[variant];

  return (
    <Image
      {...props}
      source={logo.source}
      contentFit="contain"
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: logo.width, height: logo.height }, style]}
    />
  );
};

export default Logo;
