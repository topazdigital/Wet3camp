import { useState } from 'react'
import { Link } from 'wouter'
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDollarSign,
  Eye,
  FileCheck2,
  LockKeyhole,
  MapPin,
  PencilLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { SITE_URL, useSEO } from '@/lib/useSEO'

const PAGE_TITLE = 'Advertise Your Escort Profile in Kenya | Wet3Camp Directory'
const PAGE_DESCRIPTION =
  'Create a free escort profile on Wet3Camp for consenting adults in Nairobi and across Kenya. Manage your listing and choose optional visibility upgrades.'

const monthlyPlans = [
  { name: 'Premium', price: 'KES 2,200', note: 'per month', tone: 'gold' },
  { name: 'VIP', price: 'KES 4,500', note: 'per month', tone: 'wine' },
  { name: 'Elite', price: 'KES 8,500', note: 'per month', tone: 'bright' },
]

const faqs = [
  {
    question: 'Is it free to create an escort profile?',
    answer:
      'Yes. Registration and creating a standard profile are free. Optional paid monthly tiers and featured placements are available if you choose them.',
  },
  {
    question: 'Who can submit a profile?',
    answer:
      'Wet3Camp is for consenting adults aged 18 or older. Profile submissions are reviewed before they are published.',
  },
  {
    question: 'Can I manage my own profile information?',
    answer:
      'Yes. Your profile is yours to manage. You can update the information you share, including your description and profile details, through your account.',
  },
  {
    question: 'Does Wet3Camp handle appointments or client payments?',
    answer:
      'No. Wet3Camp is a directory, not a booking or payment service. Clients and profile owners arrange any appointments and payments directly, outside the platform.',
  },
  {
    question: 'Do paid tiers guarantee enquiries or bookings?',
    answer:
      'No. Paid tiers and featured placement are optional visibility products, not guarantees of views, enquiries, bookings, income, or any particular outcome.',
  },
]

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d5b66b]">
      <span className="h-px w-7 bg-[#8e2635]" />
      {children}
    </p>
  )
}

export default function ForEscortsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { isLoggedIn, isEscort, isPendingEscort } = useAuth()
  const primaryAction = isEscort
    ? isPendingEscort
      ? { href: '/pending-approval', label: 'Check review status' }
      : { href: '/my-profile', label: 'Manage my listing' }
    : isLoggedIn
      ? { href: '/contact', label: 'Ask about listing' }
      : { href: '/register?role=escort', label: 'Create your free profile' }
  const finalHeading = isEscort
    ? isPendingEscort ? 'Your profile is under review.' : 'Your listing is yours to manage.'
    : isLoggedIn ? 'Already on Wet3Camp?' : 'Your profile starts free.'
  const finalDescription = isEscort
    ? isPendingEscort
      ? 'Check your submission status and return when your profile is approved.'
      : 'Update your listing and review optional visibility products from your account.'
    : isLoggedIn
      ? 'Contact our team if you need help setting up an escort listing with your account.'
      : 'Create an account, submit your profile for review, and choose whether optional visibility is right for you.'

  useSEO({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    canonicalPath: '/for-escorts',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${SITE_URL}/for-escorts#webpage`,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}/for-escorts`,
      inLanguage: 'en-KE',
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
    keywords:
      'advertise escort Kenya, list escort profile Kenya, escort advertising Nairobi, escort profile Nairobi, independent escorts Kenya, free escort listing Kenya',
  })

  return (
    <div className="min-h-[100dvh] bg-[#100c0d] text-[#f2ece5] lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Header />
        <main data-testid="page-for-escorts">
          <section className="relative isolate overflow-hidden border-b border-[#382428]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full border border-[#81404a]/25" />
              <div className="absolute -right-12 -top-20 h-[25rem] w-[25rem] rounded-full border border-[#81404a]/20" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(106,28,42,0.28),transparent_46%)]" />
              <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-[#100c0d] to-transparent" />
            </div>

            <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-8 sm:gap-8 sm:px-8 sm:py-10 md:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-12">
              <div className="relative z-10 max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5d3c32] bg-[#211719]/80 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#d5c6af]">
                  <MapPin size={13} className="text-[#d5b66b]" />
                  A discreet directory for Kenya
                </div>
                <h1 className="max-w-[15ch] font-serif text-[clamp(2.1rem,4.2vw,3.7rem)] leading-[0.98] tracking-[-0.045em] text-[#f6efe4]" data-testid="heading-for-escorts">
                  List your escort profile in Kenya
                  <span className="block italic text-[#d5b66b]">on your terms.</span>
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#c3b8b1] sm:text-base sm:leading-7">
                  Create a free escort listing, manage what you share, and choose whether optional visibility suits you.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center md:flex-col md:items-start lg:flex-row">
                  <Link
                    href={primaryAction.href}
                    data-testid="link-escort-signup-hero"
                    className="group inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#8e2635] px-5 text-xs font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#a43142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d5b66b] sm:text-sm"
                  >
                    {primaryAction.label}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#visibility"
                    data-testid="link-view-visibility-prices"
                    className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap px-3 text-xs font-semibold text-[#d5c6af] underline decoration-[#725850] underline-offset-4 transition-colors hover:text-[#f6efe4] sm:text-sm"
                  >
                    View upgrade options
                    <ArrowDownRight size={15} />
                  </a>
                </div>
                <p className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-[#948781]" data-testid="text-adult-review-note">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#d5b66b]" />
                  For consenting adults aged 18+. Profile submissions are reviewed.
                </p>
              </div>

              <div className="relative mx-auto hidden w-full max-w-sm md:block md:ml-auto">
                <div className="absolute -inset-3 rotate-1 border border-[#74534a]/45" aria-hidden="true" />
                <div className="relative overflow-hidden border border-[#5a393d] bg-[#1a1315] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#493136] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#73534a] bg-[#2a1d1f]">
                        <span className="font-serif text-lg italic text-[#d5b66b]">W</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#f0e8dc]">Your profile, your pace</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-[#a7968e]">Wet3Camp · Kenya</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#5d6043] bg-[#31311f]/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#c9c294]">Reviewed</span>
                  </div>
                  <div className="py-4">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#aa9286]">Profile essentials</p>
                    <div className="space-y-2">
                      {[
                        ['01', 'Choose what to share'],
                        ['02', 'Set your location'],
                        ['03', 'Keep your details current'],
                      ].map(([number, label]) => (
                        <div key={number} className="flex items-center gap-3 border-b border-[#38282a] pb-2 last:border-0 last:pb-0">
                          <span className="font-mono text-[10px] text-[#b68f64]">{number}</span>
                          <span className="text-sm text-[#d7cbc1]">{label}</span>
                          <Check size={14} className="ml-auto text-[#c7ab70]" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-[#493136] pt-3 text-[11px] leading-4 text-[#a7968e]">
                    <LockKeyhole size={15} className="shrink-0 text-[#d5b66b]" />
                    Clients contact you directly. Appointments and payments stay between you and the client.
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 border border-[#57413a] bg-[#191315] px-3 py-2 text-[9px] uppercase tracking-[0.17em] text-[#cbbcac] shadow-xl sm:flex">
                  <Sparkles size={13} className="text-[#d5b66b]" />
                  Free to get started
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12" aria-labelledby="directory-heading">
            <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
              <div>
                <SectionEyebrow>For independent adults</SectionEyebrow>
                <h2 id="directory-heading" className="max-w-md font-serif text-2xl leading-tight tracking-tight text-[#f2e9dd] sm:text-3xl">
                  Your listing. Your choices.
                </h2>
              </div>
              <div className="max-w-2xl">
                <p className="text-sm leading-6 text-[#b9aca4]">
                  Wet3Camp is a Kenya-based escort directory. Consenting adults can create a profile, manage their information, and list in Nairobi or elsewhere in Kenya.
                </p>
                <p className="mt-2 text-xs leading-5 text-[#93847e]">
                  Wet3Camp does not arrange appointments, collect client booking payments, or take a commission on arrangements between clients and profile owners.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { icon: PencilLine, title: 'You manage it', detail: 'Keep your own profile information up to date.' },
                    { icon: FileCheck2, title: 'Reviewed first', detail: 'Submissions are reviewed before publication.' },
                    { icon: CircleDollarSign, title: 'Start at no cost', detail: 'Registration and a standard listing are free.' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="flex items-start gap-2 border-l border-[#70404a] bg-[#181214] px-3 py-2.5" data-testid={`feature-${item.title.toLowerCase().replaceAll(' ', '-')}`}>
                        <Icon size={14} className="mt-0.5 shrink-0 text-[#d5b66b]" />
                        <p className="text-[11px] leading-4 text-[#9f918a]"><span className="font-semibold text-[#e7ddd1]">{item.title}.</span> {item.detail}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-[11px] leading-4 text-[#92837c]">Register free <span className="px-1 text-[#d5b66b]">›</span> submit for review <span className="px-1 text-[#d5b66b]">›</span> manage your listing</p>
              </div>
            </div>
          </section>

          <section id="visibility" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12" aria-labelledby="visibility-heading">
            <div className="grid gap-5 md:grid-cols-[0.75fr_1.25fr] md:gap-8">
              <div>
                <SectionEyebrow>Optional visibility</SectionEyebrow>
                <h2 id="visibility-heading" className="max-w-sm font-serif text-2xl leading-tight tracking-tight text-[#f2e9dd] sm:text-3xl">
                  Free listing. Paid choices, if you want them.
                </h2>
                <p className="mt-3 max-w-md text-xs leading-5 text-[#a99b94]">
                  The prices below are the current display values in Wet3Camp. Paid placement does not promise views, enquiries, bookings, or earnings.
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between border-b border-[#493136] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8c9ba]">Monthly profile tiers</h3>
                  <span className="text-[10px] text-[#9b8a82]">KES · current displayed prices</span>
                </div>
                <div className="divide-y divide-[#493136]">
                  {monthlyPlans.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between gap-4 py-2.5" data-testid={`price-tier-${plan.name.toLowerCase()}`}>
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${plan.tone === 'bright' ? 'bg-[#b98d54]' : plan.tone === 'wine' ? 'bg-[#a83d4b]' : 'bg-[#d5b66b]'}`} />
                        <span className="text-sm font-semibold text-[#e8ded2]">{plan.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-semibold text-[#e6d7bd]">{plan.price}</span>
                        <span className="ml-2 text-xs text-[#94847c]">{plan.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border border-[#493136] bg-[#171113] p-3.5 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-xs">
                      <div className="flex items-center gap-2 text-[#d5b66b]">
                        <Eye size={16} />
                        <h3 className="text-sm font-semibold">Featured placement</h3>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#a99b94]">A separate optional visibility purchase, available in three durations.</p>
                    </div>
                    <dl className="grid flex-1 grid-cols-3 gap-2 sm:max-w-sm">
                      {[
                        { term: '3 days', amount: 'KES 500' },
                        { term: 'Weekly', amount: 'KES 1,500' },
                        { term: 'Monthly', amount: 'KES 4,500' },
                      ].map((item) => (
                        <div key={item.term} className="border-l border-[#70404a] pl-3" data-testid={`price-featured-${item.term.toLowerCase().replace(' ', '-')}`}>
                          <dt className="text-[10px] uppercase tracking-wider text-[#95847d]">{item.term}</dt>
                          <dd className="mt-1 font-mono text-xs font-semibold text-[#e6d7bd]">{item.amount}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-[#81736d]" data-testid="text-pricing-disclaimer">
                  Prices shown are current in-app display values and may change. These are optional visibility products, not guarantees of results.
                </p>
              </div>
            </div>
          </section>

          <section className="border-y border-[#382428] bg-[#171113]" aria-labelledby="boundaries-heading">
            <div className="mx-auto grid max-w-7xl gap-4 px-5 py-7 sm:px-8 sm:py-9 md:grid-cols-[1fr_1.1fr] lg:px-12 lg:py-10">
              <div>
                <SectionEyebrow>Clear boundaries</SectionEyebrow>
                <h2 id="boundaries-heading" className="max-w-sm font-serif text-2xl leading-tight tracking-tight text-[#f2e9dd] sm:text-3xl">The directory ends where your arrangements begin.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-[#493136] bg-[#100c0d] p-3.5">
                  <BadgeCheck size={18} className="text-[#d5b66b]" />
                  <h3 className="mt-2 text-sm font-semibold text-[#e8ded2]">Adult-only listings</h3>
                  <p className="mt-1 text-[11px] leading-4 text-[#a99b94]">Profiles are for consenting adults aged 18 and older. Submissions are reviewed.</p>
                </div>
                <div className="border border-[#493136] bg-[#100c0d] p-3.5">
                  <CircleDollarSign size={18} className="text-[#d5b66b]" />
                  <h3 className="mt-2 text-sm font-semibold text-[#e8ded2]">Direct arrangements</h3>
                  <p className="mt-1 text-[11px] leading-4 text-[#a99b94]">Clients and profile owners arrange appointments and any payments directly, outside Wet3Camp.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10" aria-labelledby="faq-heading">
            <div className="mb-4">
              <SectionEyebrow>Good to know</SectionEyebrow>
              <h2 id="faq-heading" className="font-serif text-2xl tracking-tight text-[#f2e9dd] sm:text-3xl">Before you list</h2>
            </div>
            <div className="divide-y divide-[#493136] border-y border-[#493136]">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={faq.question} data-testid={`faq-item-${index + 1}`}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${index + 1}`}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        data-testid={`button-faq-${index + 1}`}
                        className="flex min-h-12 w-full items-center justify-between gap-5 py-3 text-left text-xs font-semibold text-[#e8ded2] transition-colors hover:text-[#d5b66b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d5b66b] sm:text-sm"
                      >
                        {faq.question}
                        <ChevronDown size={17} className={`shrink-0 text-[#bda067] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </h3>
                    <div id={`faq-answer-${index + 1}`} hidden={!isOpen} className="max-w-3xl pb-4 pr-8 text-xs leading-5 text-[#a99b94] sm:text-sm sm:leading-6" data-testid={`answer-faq-${index + 1}`}>
                      {faq.answer}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="px-5 pb-8 sm:px-8 sm:pb-12" aria-labelledby="final-cta-heading">
            <div className="relative mx-auto max-w-6xl overflow-hidden border border-[#674149] bg-[#211518] px-5 py-6 text-center sm:px-8 sm:py-8">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(142,38,53,0.32),transparent_65%)]" />
              <div className="relative">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.24em] text-[#d5b66b]">For consenting adults aged 18+</p>
                <h2 id="final-cta-heading" className="font-serif text-2xl tracking-tight text-[#f6efe4] sm:text-3xl">{finalHeading}</h2>
                <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[#b9aca4] sm:text-sm">
                  {finalDescription}
                </p>
                <Link
                  href={primaryAction.href}
                  data-testid="link-escort-signup-final"
                  className="group mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#8e2635] px-5 py-3 text-xs font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#a43142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d5b66b] sm:text-sm"
                >
                  {primaryAction.label}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                {!isLoggedIn && <p className="mt-2 text-[10px] text-[#95847d]">Registration and a standard listing are free.</p>}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
