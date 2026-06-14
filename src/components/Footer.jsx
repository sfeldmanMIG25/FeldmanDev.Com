import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="fd-footer">
      <span><MapPin size={13} /> Redlands, California</span>
      <span>&copy; {new Date().getFullYear()} Feldman Developers</span>
    </footer>
  );
}
