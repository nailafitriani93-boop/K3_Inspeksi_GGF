import "./globals.css";

export const metadata = {
  title: "Inspeksi K3 - Great Giant Foods",
  description: "Monitoring inspeksi K3 dan tindak lanjut temuan"
};

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}