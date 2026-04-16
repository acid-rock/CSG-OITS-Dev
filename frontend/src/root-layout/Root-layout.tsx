import { Outlet } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import Footer from "../components/footer/Footer";

/*This holds the root-layout to ensure the navigation and Footer to show in all route*/
const Root = () => {
  return (
    <div className="relative px-4 md:px-8 lg:px-16 lx:px-32 2xl:px-64 overflow-hidden flex flex-col">
      <Navigation />
      <Outlet />
      <Footer />
    </div>
  );
};

export default Root;
