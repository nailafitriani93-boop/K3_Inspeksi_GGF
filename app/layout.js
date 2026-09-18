import "./globals.css";

export const metadata = {
  title: "Inspeksi K3 - Great Giant Foods",
  description: "Monitoring inspeksi K3 dan tindak lanjut temuan",
  icons: {
    icon: "/ggf-estate-pg01.png",
  },
};

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}