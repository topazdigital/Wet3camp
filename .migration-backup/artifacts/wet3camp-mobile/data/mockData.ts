import type { Profile } from "@/components/ProfileCard";
import type { LiveStream } from "@/components/LiveCard";
import type { Post } from "@/components/FeedPost";

const UNSPLASH_WOMEN = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
  "https://images.unsplash.com/photo-1520810627419-35e592369a9a?w=400&q=80",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80",
  "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
  "https://images.unsplash.com/photo-1523264653568-d3d4032d1476?w=400&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
  "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=400&q=80",
];

export const PROFILES: Profile[] = [
  { id: "1", name: "Amara K.", location: "Nairobi CBD", age: 24, rating: 4.9, price: 8000, image: UNSPLASH_WOMEN[0], badge: "elite", available: true },
  { id: "2", name: "Zara M.", location: "Westlands", age: 26, rating: 4.8, price: 6500, image: UNSPLASH_WOMEN[1], badge: "vip", available: true },
  { id: "3", name: "Kezia N.", location: "Karen", age: 23, rating: 4.7, price: 5000, image: UNSPLASH_WOMEN[2], badge: "premium", available: false },
  { id: "4", name: "Fatuma H.", location: "Kilimani", age: 25, rating: 4.9, price: 10000, image: UNSPLASH_WOMEN[3], badge: "elite", available: true },
  { id: "5", name: "Diana W.", location: "Lavington", age: 27, rating: 4.6, price: 4500, image: UNSPLASH_WOMEN[4], badge: "premium", available: true },
  { id: "6", name: "Sylvia A.", location: "Parklands", age: 22, rating: 4.5, price: 3500, image: UNSPLASH_WOMEN[5], badge: "free", available: false },
  { id: "7", name: "Nadia T.", location: "Upperhill", age: 28, rating: 4.8, price: 9000, image: UNSPLASH_WOMEN[6], badge: "elite", available: true },
  { id: "8", name: "Lena O.", location: "Mombasa", age: 24, rating: 4.7, price: 5500, image: UNSPLASH_WOMEN[7], badge: "vip", available: true },
  { id: "9", name: "Grace J.", location: "Nakuru", age: 23, rating: 4.4, price: 3000, image: UNSPLASH_WOMEN[8], badge: "free", available: false },
  { id: "10", name: "Priya S.", location: "Gigiri", age: 26, rating: 4.9, price: 12000, image: UNSPLASH_WOMEN[9], badge: "elite", available: true },
  { id: "11", name: "Mercy R.", location: "Runda", age: 25, rating: 4.6, price: 7000, image: UNSPLASH_WOMEN[10], badge: "vip", available: true },
  { id: "12", name: "Tasha P.", location: "Muthaiga", age: 29, rating: 4.8, price: 8500, image: UNSPLASH_WOMEN[11], badge: "vip", available: false },
];

export const FEATURED_PROFILES: Profile[] = PROFILES.filter((p) => p.badge === "elite" || p.badge === "vip").slice(0, 5);

export const LIVE_STREAMS: LiveStream[] = [
  { id: "l1", name: "Amara K.", image: UNSPLASH_WOMEN[0], viewers: 1240, location: "Nairobi", age: 24, category: "Elite", price: 8000 },
  { id: "l2", name: "Fatuma H.", image: UNSPLASH_WOMEN[3], viewers: 890, location: "Kilimani", age: 25, category: "Elite", price: 10000 },
  { id: "l3", name: "Nadia T.", image: UNSPLASH_WOMEN[6], viewers: 2100, location: "Upperhill", age: 28, category: "Elite", price: 9000 },
  { id: "l4", name: "Zara M.", image: UNSPLASH_WOMEN[1], viewers: 456, location: "Westlands", age: 26, category: "VIP", price: 6500 },
  { id: "l5", name: "Mercy R.", image: UNSPLASH_WOMEN[10], viewers: 673, location: "Runda", age: 25, category: "VIP", price: 7000 },
  { id: "l6", name: "Priya S.", image: UNSPLASH_WOMEN[9], viewers: 3200, location: "Gigiri", age: 26, category: "Elite", price: 12000 },
];

export const FEED_POSTS: Post[] = [
  {
    id: "p1",
    author: "Amara K.",
    authorImage: UNSPLASH_WOMEN[0],
    location: "Nairobi CBD",
    time: "2m ago",
    text: "Available tonight for exclusive companionship. Booking slots going fast — DM to reserve 💫",
    image: UNSPLASH_WOMEN[0],
    likes: 142,
    comments: 23,
    badge: "elite",
  },
  {
    id: "p2",
    author: "Fatuma H.",
    authorImage: UNSPLASH_WOMEN[3],
    location: "Kilimani",
    time: "15m ago",
    text: "New week, new energy. Rates updated — check my profile for the latest packages ✨",
    likes: 98,
    comments: 11,
    badge: "elite",
  },
  {
    id: "p3",
    author: "Zara M.",
    authorImage: UNSPLASH_WOMEN[1],
    location: "Westlands",
    time: "1h ago",
    text: "Just wrapped a lovely evening session. Thank you to all my wonderful clients 🌹",
    image: UNSPLASH_WOMEN[1],
    likes: 76,
    comments: 8,
    badge: "vip",
  },
  {
    id: "p4",
    author: "Nadia T.",
    authorImage: UNSPLASH_WOMEN[6],
    location: "Upperhill",
    time: "2h ago",
    text: "Going live at 8 PM tonight. Join me! 🔴",
    likes: 203,
    comments: 45,
    badge: "elite",
  },
  {
    id: "p5",
    author: "Diana W.",
    authorImage: UNSPLASH_WOMEN[4],
    location: "Lavington",
    time: "3h ago",
    text: "Slots available for this weekend. Early birds get a 10% discount 🎉",
    likes: 55,
    comments: 6,
    badge: "premium",
  },
  {
    id: "p6",
    author: "Mercy R.",
    authorImage: UNSPLASH_WOMEN[10],
    location: "Runda",
    time: "5h ago",
    text: "Luxury companionship redefined. Book now and experience the difference.",
    image: UNSPLASH_WOMEN[10],
    likes: 119,
    comments: 17,
    badge: "vip",
  },
];

export const CONVERSATIONS = [
  { id: "c1", name: "Amara K.", image: UNSPLASH_WOMEN[0], lastMsg: "Looking forward to seeing you!", time: "2m", unread: 2, badge: "elite" as const },
  { id: "c2", name: "Fatuma H.", image: UNSPLASH_WOMEN[3], lastMsg: "My rates are listed on my profile.", time: "1h", unread: 0, badge: "elite" as const },
  { id: "c3", name: "Zara M.", image: UNSPLASH_WOMEN[1], lastMsg: "I'm available Saturday evening.", time: "3h", unread: 1, badge: "vip" as const },
  { id: "c4", name: "Nadia T.", image: UNSPLASH_WOMEN[6], lastMsg: "Thanks for the booking!", time: "Yesterday", unread: 0, badge: "elite" as const },
  { id: "c5", name: "Diana W.", image: UNSPLASH_WOMEN[4], lastMsg: "See you at 7 PM 🌹", time: "Yesterday", unread: 0, badge: "premium" as const },
  { id: "c6", name: "Mercy R.", image: UNSPLASH_WOMEN[10], lastMsg: "Your booking is confirmed.", time: "2d ago", unread: 0, badge: "vip" as const },
];
