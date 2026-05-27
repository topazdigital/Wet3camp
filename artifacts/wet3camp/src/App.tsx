import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/lib/sidebar-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { FollowProvider } from "@/lib/follow-context"
import { NotificationsProvider } from "@/lib/notifications-context";
import { BookingsProvider } from "@/lib/bookings-context"
import { FavoritesProvider } from "@/lib/favorites-context";
import Booking  from "@/pages/booking";
import Bookings from "@/pages/bookings";
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
import FeaturedUpgrade from "@/pages/featured-upgrade";
import Install from "@/pages/install";
import Live from "@/pages/live";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import MyProfile from "@/pages/my-profile";
import Register from "@/pages/register";
import Reviews from "@/pages/reviews";
import Rooms from "@/pages/rooms";
import Shop from "@/pages/shop";
import Testimonials from "@/pages/testimonials";
import Tours from "@/pages/tours";
import Videos from "@/pages/videos";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import PendingApproval from "@/pages/pending-approval";
import AuthCallback from "@/pages/auth-callback";
import Account from "@/pages/account";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { isLoggedIn, isAdmin, isPendingEscort } = useAuth();
  if (!isLoggedIn) return <Redirect to="/login" />;
  if (adminOnly && !isAdmin) return <Redirect to="/" />;
  if (isPendingEscort) return <Redirect to="/pending-approval" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin">{() => <ProtectedRoute component={Admin} adminOnly />}</Route>
      <Route path="/adverts" component={Adverts} />
      <Route path="/blacklist" component={Blacklist} />
      <Route path="/contact" component={Contact} />
      <Route path="/events" component={Events} />
      <Route path="/exclusive" component={Exclusive} />
      <Route path="/faqs" component={Faqs} />
      <Route path="/favorites">{() => <ProtectedRoute component={Favorites} />}</Route>
      <Route path="/featured-upgrade">{() => <ProtectedRoute component={FeaturedUpgrade} />}</Route>
      <Route path="/feeds" component={Feeds} />
      <Route path="/install" component={Install} />
      <Route path="/live" component={Live} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/messages">{() => <ProtectedRoute component={Messages} />}</Route>
      <Route path="/booking">{()  => <ProtectedRoute component={Booking}  />}</Route>
      <Route path="/bookings">{() => <ProtectedRoute component={Bookings} />}</Route>
      <Route path="/my-profile">{() => <ProtectedRoute component={MyProfile} />}</Route>
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:slug" component={Profile} />
      <Route path="/register" component={Register} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/shop" component={Shop} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/tours" component={Tours} />
      <Route path="/videos" component={Videos} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/account">{() => <ProtectedRoute component={Account} />}</Route>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <NotificationsProvider>
            <BookingsProvider>
            <FavoritesProvider>
            <FollowProvider>
              <SidebarProvider>
                <Router />
                <BottomNav />
              </SidebarProvider>
            </FollowProvider>
            </FavoritesProvider>
          </BookingsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
