import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Backdrop from "./components/Backdrop.jsx";
import Home from "./pages/Home.jsx";
import CardWizard from "./pages/CardWizard.jsx";
import Gart from "./pages/Gart.jsx";
import GartProduction from "./pages/GartProduction.jsx";
import Campbells from "./pages/Campbells.jsx";
import Hypertherm from "./pages/Hypertherm.jsx";

const PAGES = {
  "/": Home,
  "/cardwizard": CardWizard,
  "/gart": Gart,
  "/gart-production": GartProduction,
  "/campbells": Campbells,
  "/hypertherm": Hypertherm,
};

function NotFound() {
  return (
    <article className="fd-page">
      <a className="fd-back" href="#/"><ArrowLeft size={14} /> Back to home</a>
      <div className="fd-kicker">404</div>
      <h1>Page not found</h1>
      <p className="fd-page-lead">That page doesn't exist. Head back to the home page.</p>
    </article>
  );
}

function useHashRoute() {
  const read = () => {
    const h = window.location.hash.replace(/^#/, "");
    return h === "" ? "/" : h;
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();
  const Page = PAGES[route] || NotFound;
  return (
    <div className="fd">
      <div className="fd-grid-bg" />
      <Backdrop />
      <div className="fd-wrap">
        <Nav route={route} />
        <Page />
        <Footer />
      </div>
    </div>
  );
}
