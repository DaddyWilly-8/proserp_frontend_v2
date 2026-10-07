'use client';

import { Backdrop } from "@mui/material";
import React from "react";
import { Div } from "@jumbo/shared";
import { keyframes } from "@emotion/react";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";

interface BackdropSpinnerProps {
  message?: string;
  isRouterTransfer?: boolean;
}

// The wordmark is ProsERP's own brand mark, not an organization's - its
// color follows the app's light/dark mode (blue on light, white on dark),
// never the org's own main/light/contrast colors, which live in the module
// dots below it instead.
//
// The Backdrop itself is always a dark scrim (rgba(0,0,0,0.78)) regardless
// of app theme, so the deep indigo used for the actual logo/primary.main
// (#2113AD - correct on the white sidebar) reads muddy here. primary.light
// is the theme's own brighter variant for exactly this situation.
//
// This component is the fallback for a Suspense boundary wrapping the whole
// app in providers.tsx, so it mounts on every page navigation, not just
// occasional dialogs - a gradient-clipped text layer animated with
// mix-blend-mode was expensive enough to paint/composite on every mount
// that navigation itself felt slower. Kept intentionally cheap: a flat
// color plus a transform/opacity-only wave, nothing that forces a repaint
// of a large text area every frame.
const BRAND_BLUE = "#567FFB";
const BRAND_WHITE = "#FFFFFF";

const letterWave = keyframes`
  0%, 60%, 100% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-12px) scale(1.04); }
`;

// Flashes each letter between brand blue and white - just a `color` swap,
// not a gradient/blend-mode effect, so it stays cheap to repaint.
const colorFlash = keyframes`
  0%, 100% { color: ${BRAND_BLUE}; }
  50% { color: ${BRAND_WHITE}; }
`;

const orbitPulse = keyframes`
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
  50% { transform: translateY(-5px) scale(1.25); opacity: 1; }
`;

export const BackdropSpinner: React.FC<BackdropSpinnerProps> = ({
  message,
  isRouterTransfer
}) => {
  const { authOrganization } = useJumboAuth();
  const mainColor = authOrganization?.organization?.settings?.main_color || "#2113AD";
  const lightColor = authOrganization?.organization?.settings?.light_color || "#8da0f0";
  const contrastText = authOrganization?.organization?.settings?.contrast_text || "#FFFFFF";

  const dotColors = [mainColor, lightColor, contrastText, lightColor, mainColor];
  const WORDMARK = "ProsERP".split("");

  return (
    <Backdrop
      sx={{
        color: "#ffffff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: "column",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
      }}
      open={true}
    >
      {/* Wordmark + module dots on a plain dark backdrop */}
      <Div
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2.75,
        }}
      >
        {/* Wordmark: each letter waves and flashes blue/white in sequence */}
        <Div sx={{ display: "flex", alignItems: "center" }}>
          {WORDMARK.map((letter, index) => (
            <Div
              key={index}
              sx={{
                display: "inline-block",
                fontFamily: "NoirPro, Arial",
                fontSize: { xs: "2rem", sm: "2.5rem" },
                fontWeight: 700,
                lineHeight: 1,
                animation: `${letterWave} 1.3s ease-in-out infinite, ${colorFlash} 1.3s ease-in-out infinite`,
                animationDelay: `${index * 0.08}s, ${index * 0.08}s`,
              }}
            >
              {letter}
            </Div>
          ))}
        </Div>

        {/* Module dots - standing in for a progress bar */}
        <Div sx={{ display: "flex", gap: 1.25 }}>
          {dotColors.map((color, index) => (
            <Div
              key={index}
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: color,
                animation: `${orbitPulse} 1.1s ease-in-out infinite`,
                animationDelay: `${index * 0.15}s`,
              }}
            />
          ))}
        </Div>
      </Div>

      {!isRouterTransfer && message && (
        <Div sx={{ position: "relative", zIndex: 1, p: 2, mt: 2 }}>
          <h2 style={{ color: contrastText, textShadow: `0 0 5px ${mainColor}50` }}>{message}</h2>
        </Div>
      )}
    </Backdrop>
  );
};
