import type { ReactNode } from 'react';

export default function UnlocalizedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en-US">
      <body>{children}</body>
    </html>
  );
}
