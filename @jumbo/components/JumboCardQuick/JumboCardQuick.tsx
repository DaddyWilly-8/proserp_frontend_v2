'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardProps,
  CardHeaderProps,
  CardContentProps,
  SxProps,
  Theme,
} from '@mui/material';
import { getBgColorStyle, getBgImageStyle } from '@jumbo/utilities/styleHelpers';
import { JumboBackdrop } from '../JumboBackdrop';

interface JumboCardQuickProps extends Omit<CardProps, 'title'> {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  avatar?: React.ReactNode;
  action?: React.ReactNode;

  bgColor?: string | string[];
  bgImage?: string;
  bgGradientDir?: string;

  headerSx?: SxProps<Theme>;
  footerProps?: unknown;

  noWrapper?: boolean;
  wrapperSx?: SxProps<Theme>;

  backdrop?: boolean;
  backdropColor?: string;
  backdropOpacity?: string | number;

  reverse?: boolean;
  divider?: boolean;
}

const JumboCardQuick: React.FC<JumboCardQuickProps> = ({
  title,
  subheader,
  avatar,
  action,

  bgColor,
  bgImage,
  bgGradientDir,

  headerSx,
  footerProps,
  noWrapper = false,
  wrapperSx,

  backdrop = false,
  backdropColor = '#000000',
  backdropOpacity = 0.7,

  reverse = false,
  divider = false,

  sx,
  children,
  ...restProps
}) => {
  /**
   * IMPORTANT:
   * bgStyle is PURE CSSProperties
   * It MUST go to `style`, NOT `sx`
   */
  const bgStyle = React.useMemo<React.CSSProperties>(() => {
    let style: React.CSSProperties = {};

    if (bgImage) {
      Object.assign(style, getBgImageStyle(bgImage));
    }

    if (!bgImage && bgColor) {
      const colors = Array.isArray(bgColor) ? bgColor.join(', ') : bgColor;
      const colorStyle = getBgColorStyle({
        colors,
        gradientDir: bgGradientDir,
      });

      if (colorStyle) {
        style.background = colorStyle.backgroundImage ?? colorStyle.backgroundColor as React.CSSProperties['backgroundColor'];
      }
    }

    return style;
  }, [bgColor, bgImage, bgGradientDir]);

  return (
    <Card
      {...restProps}
      style={bgStyle} // ✅ CSS here
      sx={{
        position: 'relative',
        ...sx, // ✅ sx ONLY system styles
      }}
    >
      <JumboBackdrop
        open={backdrop}
        color={backdropColor}
        opacity={backdropOpacity}
      />

      {(title || subheader || avatar || action) && !reverse && (
        <CardHeader
          title={title}
          subheader={subheader}
          avatar={avatar}
          action={action}
          sx={{
            position: 'relative',
            zIndex: 2,
            ...(divider && {
              borderBottom: 1,
              borderColor: 'divider',
            }),
            ...headerSx,
          }}
        />
      )}

      {noWrapper ? (
        children
      ) : (
        <CardContent
          sx={{
            position: 'relative',
            zIndex: 2,
            ...wrapperSx,
          }}
        >
          {children}
        </CardContent>
      )}

      {(title || subheader || avatar || action) && reverse && (
        <CardHeader
          title={title}
          subheader={subheader}
          avatar={avatar}
          action={action}
          sx={{
            position: 'relative',
            zIndex: 2,
            ...(divider && {
              borderTop: 1,
              borderColor: 'divider',
            }),
            ...headerSx,
          }}
        />
      )}
    </Card>
  );
};

export default JumboCardQuick;
