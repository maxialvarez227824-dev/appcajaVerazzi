export const metadata = {
  title: 'Caja Verazzi - Panadería',
  description: 'Gestión de cierres de caja con IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
