import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PrayingHands } from './icons/PrayingHands';
import {
  HeartHandshake,
  Printer,
  ShieldCheck,
  Lock,
  Users,
  Upload,
  Code,
  Globe,
  Palette,
  Mic,
  CheckCircle2,
  ArrowRight,
  Church as ChurchIcon,
  ClipboardCheck,
  Flame,
} from 'lucide-react';

const APP_URL = '/app';
const REGISTER_URL = '/app?register=church';
const CWP_URL = 'https://churchwebsitepros.com';

const FEATURES = [
  {
    icon: HeartHandshake,
    title: 'Your church prayer wall',
    text: 'A warm, branded page where your congregation shares requests, prays for one another and taps "I prayed for this." Filter by category, urgent needs or praises.',
  },
  {
    icon: Printer,
    title: 'Sunday bulletin builder',
    text: 'Turn the week’s requests into a clean printed prayer list in one click. Letter, legal or bulletin-insert size, tall or wide, color or black ink.',
  },
  {
    icon: ShieldCheck,
    title: 'Pastoral review & safety',
    text: 'Requests can be screened before they go public. A review queue lets staff approve, keep private or decline anything that needs care.',
  },
  {
    icon: Lock,
    title: 'Confidential prayer vault',
    text: 'Private requests are seen only by pastors and staff, with care notes and follow-up. Contact details are never shown publicly.',
  },
  {
    icon: Users,
    title: 'Member accounts & directory',
    text: 'Members sign up, track their own requests and share praise reports. A photo directory opens to members once a pastor approves them.',
  },
  {
    icon: Upload,
    title: 'Import your existing list',
    text: 'Already keep prayer requests in a spreadsheet? Bring them in with a CSV upload, then edit or tidy any request afterward.',
  },
  {
    icon: Code,
    title: 'Embed on your website',
    text: 'Copy one snippet to show your prayer wall right on your church website, so visitors can pray and share without leaving your site.',
  },
  {
    icon: Palette,
    title: 'Your logo & colors',
    text: 'Add your church logo, colors, scripture verse and welcome message. Printed lists carry your branding too.',
  },
  {
    icon: Globe,
    title: 'Global prayer network',
    text: 'Choose to share selected requests with participating churches, so a wider family of believers can stand with your people in prayer.',
  },
];

const STEPS = [
  {
    title: 'Register your church',
    text: 'Create your pastor account and your church’s prayer wall in about two minutes.',
  },
  {
    title: 'Invite your people',
    text: 'Share the link or embed the wall on your website. Approve members and add staff.',
  },
  {
    title: 'Pray and print',
    text: 'Requests flow in all week. On Sunday, print your prayer list in one click.',
  },
];

const FAQ = [
  {
    q: 'Is it really free?',
    a: 'Yes. PrayerKeeper is free for every church right now, with no credit card and no limit on prayer requests or members.',
  },
  {
    q: 'Who can see our prayer requests?',
    a: 'Each request is shared the way the person chooses: on your church wall, private to pastoral staff only, or with the wider prayer network. Email addresses and phone numbers are only ever visible to your staff.',
  },
  {
    q: 'Can more than one person manage our church?',
    a: 'Yes. The pastor who registers can give staff access to other leaders, who can then review requests, print bulletins and approve members.',
  },
  {
    q: 'Do we need a website to use it?',
    a: 'No. Your church gets its own prayer wall page you can share as a link. If you do have a website, you can embed the wall on it.',
  },
];

/** Public home page describing PrayerKeeper. The app itself lives at /app. */
export const LandingPage: React.FC = () => {
  // People who are already signed in came here to use the app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(APP_URL);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-stone-700">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a href={CWP_URL} title="Church Website Pros" className="shrink-0">
              <img src="/cwp-logo.png" alt="Church Website Pros" className="h-10 sm:h-11 w-auto" />
            </a>
            <span className="hidden sm:block h-8 w-px bg-stone-200" />
            <span className="font-extrabold text-[#1d1e33] tracking-tight text-sm sm:text-base">PrayerKeeper</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#features" className="hidden md:inline text-stone-600 hover:text-stone-900">
              Features
            </a>
            <a href="#pricing" className="hidden md:inline text-stone-600 hover:text-stone-900">
              Pricing
            </a>
            <a href={APP_URL} className="text-stone-700 hover:text-stone-900 font-semibold whitespace-nowrap">
              Sign in
            </a>
            <a
              href={REGISTER_URL}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#d312b4] hover:bg-[#b80f9c] shadow-md shadow-[#d312b4]/25 text-white font-semibold px-4 py-2 rounded-full whitespace-nowrap"
            >
              Get started free
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(211,18,180,0.08),transparent_45%),radial-gradient(ellipse_at_top_right,rgba(67,177,164,0.14),transparent_50%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-16 sm:pt-20 sm:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#43b1a4]/15 text-[#2f8f84] text-xs font-bold px-3 py-1 rounded-full border border-[#43b1a4]/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Free for every church
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold text-[#1d1e33] leading-[1.1] tracking-tight">
              Bring your church together <span className="text-[#43b1a4]">in prayer.</span>
            </h1>
            <p className="mt-5 text-lg text-stone-600 leading-relaxed max-w-xl">
              PrayerKeeper gives your congregation one caring place to share requests and pray for each other, and
              gives your pastors simple tools to care for every need and print the Sunday prayer list.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={REGISTER_URL}
                className="inline-flex items-center justify-center gap-2 bg-[#d312b4] hover:bg-[#b80f9c] shadow-md shadow-[#d312b4]/25 text-white font-bold px-6 py-3 rounded-full shadow-sm"
              >
                <ChurchIcon className="w-5 h-5" />
                Register your church free
              </a>
              <a
                href={APP_URL}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-[#1d1e33] font-semibold px-6 py-3 rounded-full border-2 border-[#1d1e33]"
              >
                See a prayer wall
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-4 text-sm text-stone-500">No credit card. Set up in about two minutes.</p>
          </div>

          {/* Product preview */}
          <div className="relative" aria-hidden="true">
            <div className="absolute -inset-4 bg-[#43b1a4]/20 blur-3xl rounded-full" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                <span className="w-10 h-10 rounded-xl bg-[#43b1a4] text-white flex items-center justify-center">
                  <ChurchIcon className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-serif-church font-bold text-stone-900">Grace Community Prayer Wall</div>
                  <div className="text-xs text-stone-500">38 active needs · 212 prayers this week</div>
                </div>
              </div>
              {[
                { cat: 'Health & Healing', title: 'Surgery on Tuesday for my dad', prayed: 14, urgent: true },
                { cat: 'Family', title: 'Wisdom as we foster two new kids', prayed: 9 },
                { cat: 'Praise', title: 'Mom is home from the hospital!', prayed: 21, praise: true },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-stone-200 p-3.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className={c.praise ? 'text-emerald-700' : 'text-[#2f8f84]'}>{c.cat}</span>
                    {c.urgent && (
                      <span className="inline-flex items-center gap-0.5 text-rose-600">
                        <Flame className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-semibold text-stone-900 text-sm">{c.title}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                    <PrayingHands className="w-3.5 h-3.5" />
                    {c.praise ? 'Praise God!' : 'I prayed for this'} · {c.prayed}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 sm:py-20 scroll-mt-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1e33]">
            Everything your prayer ministry needs
          </h2>
          <p className="mt-3 text-stone-600 text-lg">
            Built with pastors and prayer teams, for churches of every size.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
              <span className="w-11 h-11 rounded-xl bg-[#43b1a4]/15 text-[#2f8f84] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <h3 className="mt-4 font-bold text-stone-900">{title}</h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bulletin highlight */}
      <section className="bg-[#1d1e33] text-stone-100">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[#f05bd8] text-xs font-bold uppercase tracking-wider">
              <Printer className="w-4 h-4" /> Sunday-ready in one click
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#43b1a4]">
              The prayer list prints itself.
            </h2>
            <p className="mt-4 text-stone-300 text-lg leading-relaxed">
              No more retyping requests into a Word document every Saturday night. PrayerKeeper organizes the week’s
              needs by category and prints a clean, readable sheet for your bulletin or prayer meeting.
            </p>
            <ul className="mt-6 space-y-2.5 text-stone-200">
              {[
                'Letter, legal or 5.5 × 8.5" bulletin-insert size',
                'Tall or wide pages; columns adjust automatically',
                'Full color with your church colors, or black ink only',
                'Rotate last week’s requests off the sheet without deleting them',
                'Private requests stay off the public list unless you choose otherwise',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#43b1a4] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white text-stone-900 rounded-xl shadow-2xl p-6 rotate-1" aria-hidden="true">
            <div className="border-b-2 border-[#43b1a4] pb-2 mb-3">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Baptist</div>
              <div className="font-serif-church text-xl font-bold text-[#2f8f84]">Weekly Prayer List</div>
            </div>
            <div className="grid grid-cols-2 gap-x-5 text-[11px] leading-snug">
              {[
                ['Health & Healing', ['Mary A. — Recovery after surgery', 'Tom R. — Cancer treatment', 'Jean P. — Back pain']],
                ['Family', ['The Lee family — New baby', 'Ruth S. — Son’s job search']],
                ['Missions', ['Youth team — Mexico trip']],
                ['Praises', ['Ann B. — Scans came back clear!']],
              ].map(([cat, items]) => (
                <div key={cat as string} className="mb-3">
                  <div className="bg-[#43b1a4]/15 border-b border-[#43b1a4] text-[#2f8f84] font-bold uppercase tracking-wide px-1.5 py-0.5 mb-1 text-[10px]">
                    {cat}
                  </div>
                  {(items as string[]).map((i) => (
                    <div key={i} className="py-0.5">
                      {i}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1d1e33] text-center">
          Up and running this week
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center px-4">
              <span className="w-12 h-12 mx-auto rounded-full bg-[#43b1a4] text-white font-bold text-lg flex items-center justify-center">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold text-stone-900 text-lg">{s.title}</h3>
              <p className="mt-2 text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Members */}
      <section className="bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Mic,
              title: 'Easy for every member',
              text: 'Members can type or speak their request. Anyone can pray, even without an account.',
            },
            {
              icon: ClipboardCheck,
              title: 'Follow-through on every need',
              text: 'Members see how many people prayed, renew a request, and share a praise report when God answers.',
            },
            {
              icon: ShieldCheck,
              title: 'Private and secure',
              text: 'Each church’s requests are kept separate. Staff-only details stay with staff, protected by your account.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="w-6 h-6 text-[#2f8f84]" />
              <h3 className="mt-3 font-bold text-stone-900">{title}</h3>
              <p className="mt-2 text-stone-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 sm:py-20 scroll-mt-16">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-[#d312b4] shadow-lg p-8 text-center">
          <span className="inline-block bg-[#d312b4] text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
            Free for everyone
          </span>
          <div className="mt-4 text-5xl font-extrabold text-[#1d1e33]">
            $0
          </div>
          <p className="mt-1 text-stone-500">for every church, every feature</p>
          <ul className="mt-6 space-y-2.5 text-left text-stone-700 max-w-sm mx-auto">
            {[
              'Unlimited prayer requests and members',
              'Sunday bulletin builder and printing',
              'Pastoral review queue and private vault',
              'Member accounts and photo directory',
              'Website embed and your own branding',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href={REGISTER_URL}
            className="mt-8 inline-flex items-center justify-center gap-2 w-full bg-[#d312b4] hover:bg-[#b80f9c] shadow-md shadow-[#d312b4]/25 text-white font-bold px-6 py-3 rounded-full"
          >
            Register your church free
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-16 sm:pb-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1d1e33] text-center">Questions</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-xl border border-stone-200 p-5">
              <summary className="font-semibold text-stone-900 cursor-pointer list-none flex items-center justify-between gap-3">
                {q}
                <span className="text-stone-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-stone-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#43b1a4] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">“Pray for one another.” — James 5:16</h2>
          <p className="mt-3 text-white/90 text-lg">Give your church a simple, caring way to do it together.</p>
          <a
            href={REGISTER_URL}
            className="mt-7 inline-flex items-center gap-2 bg-[#d312b4] hover:bg-[#b80f9c] text-white font-bold px-6 py-3 rounded-full shadow-md"
          >
            <ChurchIcon className="w-5 h-5" />
            Register your church free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1d1e33] text-stone-400 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a href={CWP_URL} className="flex items-center gap-3 text-stone-200 font-semibold">
            <span className="bg-white rounded-lg px-2 py-1">
              <img src="/cwp-logo.png" alt="Church Website Pros" className="h-7 w-auto" />
            </span>
            PrayerKeeper
          </a>
          <div className="flex items-center gap-5">
            <a href={APP_URL} className="hover:text-white">
              Sign in
            </a>
            <a href={CWP_URL} className="hover:text-white">
              churchwebsitepros.com
            </a>
            <span>© {new Date().getFullYear()} Church Website Pros</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
