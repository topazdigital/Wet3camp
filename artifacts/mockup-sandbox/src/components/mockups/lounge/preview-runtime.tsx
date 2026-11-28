import {
  createContext,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

type LocationSetter = (next: string) => void;
let previewLocation = "/lounge";

export function useLocation(): [string, LocationSetter] {
  const [location, setLocation] = useState(previewLocation);
  return [
    location,
    (next) => {
      previewLocation = next;
      setLocation(next);
    },
  ];
}

export function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

const demoUser = {
  id: "member-1",
  name: "Amina K.",
  role: "client",
  avatar: null as string | null,
};

export function useAuth() {
  return {
    user: demoUser,
    isAuthReady: true,
    isLoggedIn: true,
    isAdmin: false,
    isEscort: false,
    isClient: true,
    isPendingEscort: false,
    logout: () => undefined,
  };
}

const notifications = {
  notifications: [],
  unreadCount: 0,
  markRead: (_id: string) => undefined,
  markAllRead: () => undefined,
};

export function useNotifications() {
  return notifications;
}

const sidebarContext = createContext({
  isOpen: true,
  isMobile: false,
  setIsOpen: (_open: boolean) => undefined,
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return (
    <sidebarContext.Provider value={{ isOpen, isMobile, setIsOpen }}>
      {children}
    </sidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(sidebarContext);
}

export type LoungeCategory = "looking" | "general";
export interface LoungeMessage {
  id: string;
  userId: string;
  category: LoungeCategory;
  body: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}
export interface LoungeMember {
  id: string;
  name: string;
  avatar: string | null;
  lastSeen: string;
}

const demoMessages: LoungeMessage[] = [
  {
    id: "demo-1",
    userId: "member-2",
    category: "looking",
    body: "Looking for a relaxed dinner spot around Westlands this weekend. Any places you’d recommend?",
    authorName: "Miriam",
    authorAvatar: null,
    createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
  },
  {
    id: "demo-2",
    userId: "member-1",
    category: "looking",
    body: "Would love to hear about good events happening in Nairobi this month.",
    authorName: "Amina K.",
    authorAvatar: null,
    createdAt: new Date(Date.now() - 18 * 60_000).toISOString(),
  },
  {
    id: "demo-3",
    userId: "member-3",
    category: "general",
    body: "The new rooftop places in Kilimani are worth checking out. Great views at sunset.",
    authorName: "Kendi",
    authorAvatar: null,
    createdAt: new Date(Date.now() - 11 * 60_000).toISOString(),
  },
];

export const api = {
  lounge: {
    list: async (category: LoungeCategory) =>
      demoMessages.filter((message) => message.category === category),
    online: async () => ({
      count: 2,
      members: [
        {
          id: "member-2",
          name: "Miriam",
          avatar: null,
          lastSeen: new Date(Date.now() - 40_000).toISOString(),
        },
        {
          id: "member-3",
          name: "Kendi",
          avatar: null,
          lastSeen: new Date(Date.now() - 85_000).toISOString(),
        },
      ] satisfies LoungeMember[],
    }),
    heartbeat: async () => ({ ok: true }),
    send: async (category: LoungeCategory, body: string) => {
      const message: LoungeMessage = {
        id: `demo-${Date.now()}`,
        userId: demoUser.id,
        category,
        body,
        authorName: demoUser.name,
        authorAvatar: demoUser.avatar,
        createdAt: new Date().toISOString(),
      };
      demoMessages.unshift(message);
      return message;
    },
    remove: async (id: string) => {
      const index = demoMessages.findIndex((message) => message.id === id);
      if (index >= 0) demoMessages.splice(index, 1);
      return { success: true };
    },
  },
};

export function useSEO(_metadata: Record<string, unknown>) {}

export function getSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}
