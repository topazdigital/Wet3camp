import React, { lazy, Suspense } from 'react'
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/lib/sidebar-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { FollowProvider } from "@/lib/follow-context"
import { NotificationsProvider } from "@/lib/notifications-context";
import { BookingsProvider } from "@/lib/bookings-context"
import { FavoritesProvider } from "@/lib/favorites-context";
import BottomNav from "@/components/BottomNav";
import { ImpersonationBanner } from "@/pages/view-as";

// ── Lazy-load every page — each becomes its own JS chunk loaded on demand ─────
const NotFound        = lazy(() => import("@/pages/not-found"))
const Home            = lazy(() => import("@/pages/home"))
const Admin           = lazy(() => import("@/pages/admin"))
const Adverts         = lazy(() => import("@/pages/adverts"))
const Blacklist       = lazy(() => import("@/pages/blacklist"))
const Contact         = lazy(() => import("@/pages/contact"))
const Events          = lazy(() => import("@/pages/events"))
const Exclusive       = lazy(() => import("@/pages/exclusive"))
const Faqs            = lazy(() => import("@/pages/faqs"))
const Favorites       = lazy(() => import("@/pages/favorites"))
const Feeds           = lazy(() => import("@/pages/feeds"))
const FeaturedUpgrade = lazy(() => import("@/pages/featured-upgrade"))
const Install         = lazy(() => import("@/pages/install"))
const Live            = lazy(() => import("@/pages/live"))
const Login           = lazy(() => import("@/pages/login"))
const ForgotPassword  = lazy(() => import("@/pages/forgot-password"))
const Messages        = lazy(() => import("@/pages/messages"))
const Profile         = lazy(() => import("@/pages/profile"))
const MyProfile       = lazy(() => import("@/pages/my-profile"))
const Register        = lazy(() => import("@/pages/register"))
const Reviews         = lazy(() => import("@/pages/reviews"))
const Rooms           = lazy(() => import("@/pages/rooms"))
const Shop            = lazy(() => import("@/pages/shop"))
const Testimonials    = lazy(() => import("@/pages/testimonials"))
const Tours           = lazy(() => import("@/pages/tours"))
const Videos          = lazy(() => import("@/pages/videos"))
const Blog            = lazy(() => import("@/pages/blog"))
const BlogPost        = lazy(() => import("@/pages/blog-post"))
const PendingApproval = lazy(() => import("@/pages/pending-approval"))
const AuthCallback    = lazy(() => import("@/pages/auth-callback"))
const Account         = lazy(() => import("@/pages/account"))
const ChooseRole      = lazy(() => import("@/pages/choose-role"))
const SearchPage      = lazy(() => import("@/pages/search"))
const TierBenefits    = lazy(() => import("@/pages/tier-benefits"))
const ClaimProfile    = lazy(() => import("@/pages/claim-profile"))
const LiveStream      = lazy(() => import("@/pages/live-stream"))
const PaymentHistory  = lazy(() => import("@/pages/payment-history"))

// ── Global QueryClient — aggressive caching + no pointless refetches ─────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          5 * 60 * 1000,   // data stays fresh 5 min
      gcTime:            15 * 60 * 1000,   // keep in cache 15 min
      retry:              1,
      refetchOnWindowFocus:    false,       // don't re-fetch when tab regains focus
      refetchOnReconnect:      true,
      refetchOnMount:          false,       // use cached data on re-mount
    },
  },
})

// ── Lightweight page spinner shown while a lazy chunk downloads ───────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { isLoggedIn, isAdmin, isPendingEscort } = useAuth();
  if (!isLoggedIn) return <Redirect to="/login" />;
  if (adminOnly && !isAdmin) return <Redirect to="/" />;
  if (isPendingEscort) return <Redirect to="/pending-approval" />;
  return <Component />;
}

function AtProfileRoute() {
  const [location] = useLocation();
  if (location.startsWith('/@')) return <Profile />;
  return <NotFound />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/booking">{() => <Redirect to="/" />}</Route>
        <Route path="/bookings">{() => <Redirect to="/" />}</Route>
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
        <Route path="/auth/choose-role" component={ChooseRole} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/search" component={SearchPage} />
        <Route path="/tier-benefits" component={TierBenefits} />
        <Route path="/claim/:id" component={ClaimProfile} />
        <Route path="/live/:escortId" component={LiveStream} />
        <Route path="/payment-history">{() => <ProtectedRoute component={PaymentHistory} />}</Route>
        <Route component={AtProfileRoute} />
      </Switch>
    </Suspense>
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
