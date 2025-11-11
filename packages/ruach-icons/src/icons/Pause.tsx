import React from 'react';
import { Icon, IconProps } from '../Icon';

export const PauseIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </Icon>
);
