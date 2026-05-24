import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/lib/sidebar-context";
import BottomNav from "@/components/BottomNav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Adverts from "@/pages/adverts";
import Blacklist from "@/pages/blacklist";
import Contact from "@/pages/contact";
import Events from "@/pages/events";
import Exclusive from "@/pages/exclusive";
import Faqs from "@/pages/faqs";
import Favorites from "@/pages/favorites";
import Feeds from "@/pages/feeds";
import Install from "@/pages/install";
import Live from "@/pages/live";
import Login from "@/pages/login";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Register from "@/pages/register";
import Reviews from "@/pages/reviews";
import Rooms from "@/pages/rooms";
import Shop from "@/pages/shop";
import Testimonials from "@/pages/testimonials";
import Tours from "@/pages/tours";
import Videos from "@/pages/videos";
import Booking from "@/pages/booking";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/adverts" component={Adverts} />
      <Route path="/blacklist" component={Blacklist} />
      <Route path="/booking" component={Booking} />
      <Route path="/contact" component={Contact} />
      <Route path="/events" component={Events} />
      <Route path="/exclusive" component={Exclusive} />
      <Route path="/faqs" component={Faqs} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/feeds" component={Feeds} />
      <Route path="/install" component={Install} />
      <Route path="/live" component={Live} />
      <Route path="/login" component={Login} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/register" component={Register} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/shop" component={Shop} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/tours" component={Tours} />
      <Route path="/videos" component={Videos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <SidebarProvider>
          <Router />
          <BottomNav />
        </SidebarProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
