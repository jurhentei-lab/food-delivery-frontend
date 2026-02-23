import "./globals.css";

export const metadata = {
  title: "NomNom Food Delivery",
  description: "Food delivery web application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
