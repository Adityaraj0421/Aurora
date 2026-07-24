"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  MessageCircle,
  Search,
  Send,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Surface = "inspiration" | "requests" | "plans";
type Panel = "detail" | "confirm" | "success" | "context" | "search" | "item" | null;
type ContextKey = "location" | "time" | "with";
type PlanStepState = "checked" | "request" | "dependent";

type PlanStep = {
  time: string;
  title: string;
  detail: string;
  state: PlanStepState;
};

type RequestRecord = {
  id: number;
  reference: string;
  title: string;
  status: string;
  owner: string;
  guests: string;
  planJson: string;
  note: string;
  submittedAt: string;
};

type Experience = {
  id: string;
  image: string;
  imagePosition?: string;
  label: string;
  title: string;
  body: string;
  metadata: string;
  badge: string;
  detail: string;
  provenance: string;
};

type EditNotice = {
  title: string;
  detail: string;
  previousContexts: string[];
  previousSettings: Record<ContextKey, string>;
};

const eveningPlan: PlanStep[] = [
  {
    time: "8:15 PM",
    title: "Mountain",
    detail: "Table for two · checked at 6:42 PM · not held",
    state: "checked",
  },
  {
    time: "10:30 PM",
    title: "Ronnie Scott’s",
    detail: "Late set · custom access request required",
    state: "request",
  },
  {
    time: "After",
    title: "Car to your hotel",
    detail: "Added after both stops are confirmed",
    state: "dependent",
  },
];

const tomorrow: Experience[] = [
  {
    id: "recovery",
    image: "/images/sauna.webp",
    label: "Recovery · 8:30 AM",
    title: "A quieter start.",
    body: "Hydrotherapy, sauna and a short treatment selected around your sleep and travel.",
    metadata: "Surrenne · Belgravia · 90 min",
    badge: "Member access",
    detail: "A private recovery circuit arranged for the morning after a late night, with your treatment preferences already shared.",
    provenance: "Selected from your recovery preferences and tomorrow’s first calendar commitment.",
  },
  {
    id: "movement",
    image: "/images/london-arrival.webp",
    imagePosition: "50% 60%",
    label: "Move · 9:00 AM",
    title: "Hyde Park, before the day begins.",
    body: "A private movement session from your hotel, with breakfast ready when you return.",
    metadata: "Door to door · 75 min",
    badge: "Fits your morning",
    detail: "Your trainer meets you at the hotel. The route, pace and breakfast timing flex around how you feel when you wake.",
    provenance: "Based on your hotel, preferred training window and a clear morning calendar.",
  },
];

const discovery: Experience[] = [
  {
    id: "art",
    image: "/images/tate-performance.webp",
    imagePosition: "50% 42%",
    label: "Art · South Bank",
    title: "Tate, after hours.",
    body: "A private walk through the galleries with a guide who knows where to pause.",
    metadata: "90 min · Up to 4 guests",
    badge: "Request access",
    detail: "A quiet route through the collection after public hours, shaped around the artists and movements you return to.",
    provenance: "An Aurora editor’s pick, matched to artists saved in your London collection.",
  },
  {
    id: "lunch",
    image: "/images/candlelit-table.webp",
    imagePosition: "45% 54%",
    label: "Lunch · Hammersmith",
    title: "Sunday at The River Café.",
    body: "A long table by the garden, kept open for whoever joins.",
    metadata: "2½ hours · Good for 4–6",
    badge: "Maya saved",
    detail: "A table that can expand as plans settle, with the kitchen briefed on everyone’s preferences before you arrive.",
    provenance: "From a shared save by Maya and your preference for long Sunday lunches.",
  },
  {
    id: "escape",
    image: "/images/london-rain.webp",
    imagePosition: "49% 54%",
    label: "Escape · Kent",
    title: "One night in Deal.",
    body: "Dinner downstairs, the sea in the morning, London before noon.",
    metadata: "1 night · Under 90 min by train",
    badge: "Fits 24–25 October",
    detail: "An overnight that feels longer than it is: late train out, a room above dinner, and a clean return before Monday begins.",
    provenance: "Matched to an open overnight in both calendars and your saved coastal stays.",
  },
];

const contextOptions = ["Keep it close", "Bring friends", "Slow tomorrow down", "Something new"];

const refinementPrompts = [
  { title: "Keep tonight close", detail: "Fewer transfers, more time there", context: "Keep it close" },
  { title: "Make tomorrow slower", detail: "Put recovery ahead of everything else", context: "Slow tomorrow down" },
  { title: "Plan for four", detail: "Open the evening up to friends", context: "Bring friends" },
];

const contextSettingOptions: Record<ContextKey, readonly string[]> = {
  location: ["London", "Central London", "Within 30 min"],
  time: ["Until Sunday, 8:00 PM", "Tonight only", "Tomorrow morning"],
  with: ["Maya", "Solo", "Friends"],
};

const contextSettingLabels: Record<ContextKey, string> = {
  location: "Location",
  time: "Time",
  with: "Company",
};

function parsePlan(planJson: string): PlanStep[] {
  try {
    const value = JSON.parse(planJson) as PlanStep[];
    return Array.isArray(value) ? value : eveningPlan;
  } catch {
    return eveningPlan;
  }
}

function formatSubmitted(value: string) {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  }).format(date);
}

function AuroraSignal({ active = false }: { active?: boolean }) {
  return <span className={`aurora-signal${active ? " is-active" : ""}`} aria-hidden="true" />;
}

function BrandMark({ className = "" }: { className?: string }) {
  return <Image className={className} src="/aurora-logo.png" alt="Aurora" width={899} height={153} priority unoptimized />;
}

function IconButton({
  label,
  children,
  onClick,
  className = "",
  pressed,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <button
      className={`icon-button ${className}`}
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ExperienceCard({
  item,
  onOpen,
  featured = false,
}: {
  item: Experience;
  onOpen: (item: Experience) => void;
  featured?: boolean;
}) {
  return (
    <div
      className={`experience-card-shell${featured ? " experience-card-shell--featured" : " experience-card-shell--compact"}`}
    >
      <button className="experience-card experience-card--compact" type="button" onClick={() => onOpen(item)} aria-label={`Open ${item.title}`}>
        <Image
          fill
          unoptimized
          src={item.image}
          alt=""
          className="experience-card__image"
          style={{ objectPosition: item.imagePosition }}
          sizes={featured ? "(max-width: 700px) 100vw, 58vw" : "(max-width: 700px) 100vw, 30vw"}
        />
        <span className="experience-card__veil" />
        <span className="experience-card__topline">
          <span>{item.label}</span>
          <ArrowUpRight size={18} strokeWidth={1.6} />
        </span>
        <span className="experience-card__content">
          <span className="experience-card__badge">{item.badge}</span>
          <strong>{item.title}</strong>
          <span className="experience-card__body">{item.body}</span>
          <span className="experience-card__meta">{item.metadata}</span>
        </span>
      </button>
    </div>
  );
}

function EditorialCard({ item, onOpen }: { item: Experience; onOpen: (item: Experience) => void }) {
  return (
    <button className="editorial-card" type="button" onClick={() => onOpen(item)}>
      <span className="editorial-card__image">
        <Image fill unoptimized src={item.image} alt="" style={{ objectPosition: item.imagePosition }} sizes="(max-width: 700px) 34vw, 280px" />
      </span>
      <span className="editorial-card__copy">
        <span className="editorial-card__topline"><span>{item.label}</span><span>{item.badge}</span></span>
        <strong>{item.title}</strong>
        <span>{item.body}</span>
        <small>{item.metadata}</small>
      </span>
      <ArrowUpRight className="editorial-card__arrow" size={19} strokeWidth={1.5} />
    </button>
  );
}

function StatusLabel({ state }: { state: PlanStepState }) {
  const labels: Record<PlanStepState, string> = {
    checked: "Checked · not held",
    request: "Request required",
    dependent: "After confirmation",
  };
  return <span className={`operational-state operational-state--${state}`}>{labels[state]}</span>;
}

export function AuroraExperience() {
  const [surface, setSurface] = useState<Surface>("inspiration");
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedItem, setSelectedItem] = useState<Experience | null>(null);
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [currentRequest, setCurrentRequest] = useState<RequestRecord | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const initialSettings: Record<ContextKey, string> = {
    location: "London",
    time: "Until Sunday, 8:00 PM",
    with: "Maya",
  };
  const [draftSettings, setDraftSettings] = useState<Record<ContextKey, string>>(initialSettings);
  const [appliedSettings, setAppliedSettings] = useState<Record<ContextKey, string>>(initialSettings);
  const [draftContexts, setDraftContexts] = useState<string[]>(["Slow tomorrow down"]);
  const [appliedContexts, setAppliedContexts] = useState<string[]>(["Slow tomorrow down"]);
  const [editNotice, setEditNotice] = useState<EditNotice | null>(null);
  const [greeting, setGreeting] = useState("Good evening");
  const [isRecomposing, setIsRecomposing] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recomposeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);

  const panelOpen = panel !== null;
  const bringFriends = appliedContexts.includes("Bring friends") || appliedSettings.with === "Friends";
  const keepClose = appliedContexts.includes("Keep it close") || appliedSettings.location === "Central London";
  const slowTomorrow = appliedContexts.includes("Slow tomorrow down");
  const somethingNew = appliedContexts.includes("Something new");

  const heroCopy = useMemo(() => {
    if (bringFriends) {
      return {
        eyebrow: "A table that can grow in Soho",
        title: "Dinner, with room for four.",
        description: "Mountain at 8:15, a flexible table, then the late set for whoever stays. Four minutes between both stops.",
      };
    }
    if (keepClose) {
      return {
        eyebrow: "Two stops, one neighbourhood",
        title: "More evening. Less moving.",
        description: "Dinner and live music within four minutes of each other, with a car waiting only when you ask for it.",
      };
    }
    return {
      eyebrow: "A considered evening in Soho",
      title: "Dinner, then the late set.",
      description: "Mountain at 8:15. Ronnie Scott’s at 10:30. Four minutes between them, with enough room to linger.",
    };
  }, [bringFriends, keepClose]);

  const tomorrowItems = useMemo(() => slowTomorrow ? tomorrow : [...tomorrow].reverse(), [slowTomorrow]);
  const discoveryItems = useMemo(() => somethingNew ? [discovery[0], discovery[2], discovery[1]] : discovery, [somethingNew]);
  const selectedRequest = requests.find((item) => item.id === selectedRequestId) ?? requests[0] ?? null;

  const panelTitle = useMemo(() => {
    if (panel === "detail") return heroCopy.title;
    if (panel === "confirm") return "Send this request?";
    if (panel === "success") return "Request sent.";
    if (panel === "context") return "Shape your context";
    if (panel === "search") return "Search inspiration";
    if (panel === "item") return selectedItem?.title ?? "Experience";
    return "Aurora";
  }, [heroCopy.title, panel, selectedItem]);

  function notify(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      setRequestsLoading(true);
      try {
        const response = await fetch("/api/requests", { cache: "no-store" });
        if (!response.ok) throw new Error("Requests are temporarily unavailable.");
        const payload = (await response.json()) as { requests?: RequestRecord[] };
        if (cancelled) return;
        const nextRequests = payload.requests ?? [];
        setRequests(nextRequests);
        setSelectedRequestId((current) => current ?? nextRequests[0]?.id ?? null);
      } catch {
        if (!cancelled) setRequestError("The request timeline could not be refreshed. Your plan is still here.");
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }
    void loadRequests();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Client-only correction: SSR renders the neutral "Good evening" so hydration
    // stays stable; after mount we reflect the visitor's real time of day.
    const hour = new Date().getHours();
    const next = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(next);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (recomposeTimer.current) clearTimeout(recomposeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!panel || panel === "search") return;
    const frame = window.requestAnimationFrame(() => panelTitleRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [panel]);

  function navigate(next: Surface) {
    setSurface(next);
    setPanel(null);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function openExperience(item: Experience) {
    setSelectedItem(item);
    setPanel("item");
  }

  function toggleSaved() {
    setSaved((current) => {
      notify(current ? "Removed from your London plan" : "Added to your London plan");
      return !current;
    });
  }

  function sendToMaya() {
    if (sent) {
      notify("Already shared with Maya · visible to you both");
      return;
    }
    setSent(true);
    notify("Shared with Maya · revoke anytime from Plans");
  }

  async function confirmRequest() {
    if (isConfirming) return;
    setIsConfirming(true);
    setRequestError(null);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: heroCopy.title,
          guests: bringFriends ? "Aditya + Maya + 2 guests" : "Aditya + Maya",
          note: requestNote,
          plan: eveningPlan,
        }),
      });
      const payload = (await response.json()) as { request?: RequestRecord; error?: string };
      if (!response.ok || !payload.request) throw new Error(payload.error || "The request could not be sent.");
      setCurrentRequest(payload.request);
      setRequests((current) => [payload.request as RequestRecord, ...current]);
      setSelectedRequestId(payload.request.id);
      setPanel("success");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "The request could not be sent.");
    } finally {
      setIsConfirming(false);
    }
  }

  function applyEdit(nextContexts: string[], nextSettings: Record<ContextKey, string>, title: string) {
    const previousContexts = [...appliedContexts];
    const previousSettings = { ...appliedSettings };
    const details: string[] = [];
    if (nextContexts.includes("Keep it close")) details.push("closer transfers");
    if (nextContexts.includes("Bring friends")) details.push("more flexible tables");
    if (nextContexts.includes("Slow tomorrow down")) details.push("recovery first tomorrow");
    if (nextContexts.includes("Something new")) details.push("one less familiar option");
    if (details.length === 0) details.push("your current time and company");

    setAppliedContexts(nextContexts);
    setAppliedSettings(nextSettings);
    setDraftContexts(nextContexts);
    setDraftSettings(nextSettings);
    setEditNotice({
      title,
      detail: `Recomposed around ${details.join(", ")}.`,
      previousContexts,
      previousSettings,
    });
    setPanel(null);
    notify("Three recommendations were reshaped");
    if (recomposeTimer.current) clearTimeout(recomposeTimer.current);
    setIsRecomposing(true);
    recomposeTimer.current = setTimeout(() => setIsRecomposing(false), 800);
    window.requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" }));
  }

  function undoEdit() {
    if (!editNotice) return;
    setAppliedContexts(editNotice.previousContexts);
    setDraftContexts(editNotice.previousContexts);
    setAppliedSettings(editNotice.previousSettings);
    setDraftSettings(editNotice.previousSettings);
    setEditNotice(null);
    notify("Previous edit restored");
  }

  function applyQuickRefinement(context: string, title: string) {
    const next = appliedContexts.includes(context)
      ? appliedContexts.filter((item) => item !== context)
      : [...appliedContexts.filter((item) => item !== "Something new" || context === "Something new"), context];
    applyEdit(next, appliedSettings, title);
  }

  function curatePrompt(message: string) {
    const prompt = message.trim();
    if (!prompt) return;
    const next = new Set(appliedContexts);
    if (/close|near|walk|soho/i.test(prompt)) next.add("Keep it close");
    if (/friend|four|group|together/i.test(prompt)) next.add("Bring friends");
    if (/slow|recovery|quiet|rest/i.test(prompt)) next.add("Slow tomorrow down");
    if (/new|surprise|different|discover/i.test(prompt)) next.add("Something new");
    if (next.size === appliedContexts.length) next.add("Something new");
    setChatInput("");
    applyEdit([...next], appliedSettings, `Aurora interpreted “${prompt}”`);
  }

  function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    curatePrompt(chatInput);
  }

  function toggleDraftContext(option: string) {
    setDraftContexts((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  }

  function cycleContextSetting(key: ContextKey) {
    const options = contextSettingOptions[key];
    const currentIndex = options.indexOf(draftSettings[key]);
    setDraftSettings((current) => ({ ...current, [key]: options[(currentIndex + 1) % options.length] }));
  }

  function toggleSavedItem(item: Experience) {
    const isSaved = savedItems.includes(item.id);
    setSavedItems((current) => isSaved ? current.filter((itemId) => itemId !== item.id) : [...current, item.id]);
    notify(isSaved ? "Removed from saved" : `Saved “${item.title}”`);
  }

  return (
    <div className="aurora-app" data-surface={surface}>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Aurora home" onClick={() => setSurface("inspiration")}>
          <BrandMark />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {(["inspiration", "requests", "plans"] as Surface[]).map((item) => (
            <button key={item} type="button" className={surface === item ? "is-active" : ""} onClick={() => navigate(item)}>
              {item[0].toUpperCase() + item.slice(1)}
              {item === "requests" && requests.length > 0 && <span className="nav-count">{requests.length}</span>}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <IconButton label="Search inspiration" onClick={() => { setSurface("inspiration"); setPanel("search"); }}>
            <Search size={20} strokeWidth={1.6} />
          </IconButton>
          <button className="profile-button" type="button" onClick={() => notify("Aditya · private member profile")} aria-label="Open member profile">A</button>
        </div>
      </header>

      <main id="main-content" data-recomposing={isRecomposing ? "true" : undefined}>
        {surface === "inspiration" && (
          <>
            <section className="intro" id="top">
              <div className="intro__context"><span>Friday</span><span className="intro__dot" /><span>London</span></div>
              <div className="intro__heading-row">
                <div>
                  <h1>{`${greeting}, Aditya.`}</h1>
                  <p>{editNotice ? "Your edit has been recomposed." : "A few ideas that fit the time you have."}</p>
                </div>
                <button className="edit-context" type="button" onClick={() => setPanel("context")}><SlidersHorizontal size={17} strokeWidth={1.6} />Shape the edit</button>
              </div>
              <div className="context-strip" aria-label="Current personal context">
                <button type="button" onClick={() => setPanel("context")}><MapPin size={16} />{appliedSettings.location}</button>
                <button type="button" onClick={() => setPanel("context")}><CalendarDays size={16} />{appliedSettings.time}</button>
                <button type="button" onClick={() => setPanel("context")}><Users size={16} />{appliedSettings.with === "Maya" ? "With Maya" : appliedSettings.with}</button>
              </div>
              {editNotice && (
                <div className="edit-update" role="status" aria-live="polite">
                  <span><AuroraSignal active /><span><strong>{editNotice.title}</strong><small>{editNotice.detail}</small></span></span>
                  <button type="button" onClick={undoEdit}>Undo</button>
                </div>
              )}
            </section>

            <section className="hero-section" id="inspiration" aria-labelledby="hero-title">
              <div className="hero-card">
                <Image fill priority unoptimized src="/images/dinner-late-set.webp" alt="A couple dining at an intimate candlelit restaurant" sizes="(max-width: 700px) 100vw, 1380px" />
                <span className="hero-card__light" /><span className="hero-card__veil" />
                <div className="hero-card__status"><AuroraSignal active /><span>Available to request · checked 6:42 PM · not held</span></div>
                <div className="hero-card__copy">
                  <p className="eyebrow">{heroCopy.eyebrow}</p>
                  <h2 id="hero-title">{heroCopy.title}</h2>
                  <p className="hero-card__description">{heroCopy.description}</p>
                  <div className="hero-card__meta">
                    <span><MapPin size={16} /> Soho · four-minute walk</span>
                    <span><Clock3 size={16} /> 3½ hours</span>
                    <span><Users size={16} /> {bringFriends ? "Flexible for four" : "Aditya + Maya"}</span>
                  </div>
                  <div className="hero-card__actions">
                    <button className="primary-action" type="button" onClick={() => setPanel("detail")}>See the plan <ArrowRight size={18} /></button>
                    <button className={`secondary-action${sent ? " is-success" : ""}`} type="button" onClick={sendToMaya}>
                      <span className="button-state" key={sent ? "sent" : "send"}>{sent ? <Check size={18} /> : <Send size={18} />}{sent ? "Shared with Maya" : "Share with Maya"}</span>
                    </button>
                    <IconButton label={saved ? "Remove saved plan" : "Save this plan"} onClick={toggleSaved} className={saved ? "is-selected" : ""} pressed={saved}>
                      <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
                    </IconButton>
                  </div>
                </div>
              </div>
            </section>

            <section className="content-section content-section--compact" aria-labelledby="tomorrow-title">
              <div className="section-heading">
                <div><p className="eyebrow">Your next clear window</p><h2 id="tomorrow-title">For tomorrow morning</h2></div>
                <p>{slowTomorrow ? "Recovery is being prioritised." : "Designed around a late night."}</p>
              </div>
              <div className="editorial-list">
                {tomorrowItems.map((item) => <EditorialCard key={item.id} item={item} onOpen={openExperience} />)}
              </div>
            </section>

            <section className="content-section" aria-labelledby="together-title">
              <div className="section-heading">
                <div><p className="eyebrow">Built from your shared saves</p><h2 id="together-title">Better together</h2></div>
                <div className="shared-avatars" aria-label="Aditya and Maya, three shared saves"><span>A</span><span>M</span><small>3 shared saves</small></div>
              </div>
              <div className="weekend-layout">
                <div className="weekend-card-shell">
                  <button className="weekend-card" type="button" onClick={() => openExperience({
                    id: "bruton", image: "/images/bruton-manor.webp", imagePosition: "50% 54%", label: "A weekend to keep",
                    title: "Forty-eight hours in Bruton.", body: "Art, long lunches and nowhere else to be.",
                    metadata: "17–19 October · 2 hr 5 min from London", badge: "3 shared saves",
                    detail: "A countryside weekend drawn from the places you and Maya have both kept returning to.",
                    provenance: "Created from three places saved by both you and Maya, with a shared free weekend.",
                  })}>
                    <Image fill unoptimized src="/images/bruton-manor.webp" alt="An English manor set within a quiet country landscape" sizes="(max-width: 960px) 100vw, 70vw" />
                    <span className="weekend-card__veil" />
                    <span className="weekend-card__copy"><span className="eyebrow">A weekend to keep</span><strong>Forty-eight hours in Bruton.</strong><span>Art, long lunches and nowhere else to be.</span><span className="weekend-card__meta">17–19 October · 2 hr 5 min from London</span></span>
                    <span className="weekend-card__action">Open the weekend <ArrowUpRight size={18} /></span>
                  </button>
                </div>
                <aside className="shared-context-card">
                  <p className="eyebrow">Why it surfaced</p>
                  <h3>A shared weekend opened up.</h3>
                  <ul>
                    <li><span>01</span><div><strong>Both calendars are clear</strong><small>17–19 October · shared availability</small></div></li>
                    <li><span>02</span><div><strong>Three places saved by both</strong><small>Osip, Hauser & Wirth, At the Chapel</small></div></li>
                    <li><span>03</span><div><strong>Under your travel limit</strong><small>2 hr 5 min from London</small></div></li>
                  </ul>
                  <button type="button" onClick={() => navigate("plans")}>See shared plan <ArrowRight size={17} /></button>
                </aside>
              </div>
            </section>

            <section className="content-section" aria-labelledby="discovery-title">
              <div className="section-heading">
                <div><p className="eyebrow">A little further out</p><h2 id="discovery-title">Worth making room for</h2></div>
                <button className="text-action" type="button" onClick={() => setPanel("search")}>Explore all <ArrowRight size={17} /></button>
              </div>
              <div className="discovery-grid discovery-grid--editorial">
                {discoveryItems.map((item, index) => <ExperienceCard key={item.id} item={item} onOpen={openExperience} featured={index === 0} />)}
              </div>
            </section>

            <section className="shape-section" aria-labelledby="shape-title">
              <div className="shape-section__inner">
                <div className="shape-section__copy"><p className="eyebrow">Refine the edit</p><h2 id="shape-title">Tell Aurora what matters now.</h2><p>Each choice immediately changes the recommendations above—and shows you why.</p></div>
                <div className="refinement-list" aria-label="Ways to refine your edit">
                  {refinementPrompts.map((item, index) => (
                    <button key={item.title} type="button" onClick={() => applyQuickRefinement(item.context, item.title)}>
                      <span className="refinement-list__number">0{index + 1}</span><span className="refinement-list__copy"><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={18} strokeWidth={1.6} />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {surface === "requests" && (
          <section className="product-surface" id="top">
            <header className="surface-heading"><div><p className="eyebrow">Your concierge timeline</p><h1>Requests</h1><p>Every promise, owner and next step—kept in one place.</p></div><button className="secondary-action" type="button" onClick={() => navigate("inspiration")}>Start a request <ArrowRight size={17} /></button></header>
            {requestError && <div className="surface-alert"><AuroraSignal /><span>{requestError}</span></div>}
            {requestsLoading ? (
              <div className="surface-loading"><AuroraSignal active /><span>Refreshing your private timeline…</span></div>
            ) : selectedRequest ? (
              <div className="request-workspace">
                <aside className="request-index" aria-label="Your requests">
                  <p>Open and recent</p>
                  {requests.map((request) => (
                    <button key={request.id} type="button" className={selectedRequest.id === request.id ? "is-active" : ""} onClick={() => setSelectedRequestId(request.id)}>
                      <span><strong>{request.title}</strong><small>{formatSubmitted(request.submittedAt)} · {request.reference}</small></span><span className="request-index__status"><i />{request.status}</span>
                    </button>
                  ))}
                </aside>
                <article className="request-record">
                  <div className="request-record__header">
                    <div><p className="eyebrow">{selectedRequest.reference}</p><h2>{selectedRequest.title}</h2><p>Submitted {formatSubmitted(selectedRequest.submittedAt)} · for {selectedRequest.guests}</p></div>
                    <span className="request-status"><AuroraSignal active /> Access checks in progress</span>
                  </div>
                  <div className="request-owner"><span className="owner-avatar">L</span><span><small>Current owner</small><strong>{selectedRequest.owner}</strong><em>Next update promised within 15 minutes</em></span><button type="button" onClick={() => { setChatInput(`Update me on ${selectedRequest.reference}`); navigate("inspiration"); }}>Message team</button></div>
                  <section className="request-progress" aria-labelledby="request-progress-title">
                    <h3 id="request-progress-title">Request progress</h3>
                    <div className="request-progress__rail">
                      <div className="is-complete"><span><Check size={14} /></span><strong>Requested</strong><small>{formatSubmitted(selectedRequest.submittedAt)}</small></div>
                      <div className="is-active"><span><AuroraSignal active /></span><strong>Checking access</strong><small>In progress</small></div>
                      <div><span>3</span><strong>Your approval</strong><small>After holds</small></div>
                      <div><span>4</span><strong>Confirmed</strong><small>Not yet</small></div>
                    </div>
                  </section>
                  <section className="request-stops" aria-labelledby="request-stops-title">
                    <h3 id="request-stops-title">Live fulfilment</h3>
                    {parsePlan(selectedRequest.planJson).map((step) => (
                      <div key={`${step.time}-${step.title}`}><time>{step.time}</time><span><strong>{step.title}</strong><small>{step.detail}</small></span><StatusLabel state={step.state} /></div>
                    ))}
                  </section>
                  <div className="request-commitment"><Check size={17} /><span><strong>No charge has been made.</strong> Aurora will ask for approval after any holds, prices and cancellation terms are confirmed.</span></div>
                  {selectedRequest.note && <div className="request-note"><small>Your note</small><p>{selectedRequest.note}</p></div>}
                </article>
              </div>
            ) : (
              <div className="empty-surface"><h2>No open requests.</h2><p>When you ask Aurora to arrange something, its owner, status and next update will live here.</p><button className="primary-action" type="button" onClick={() => navigate("inspiration")}>Explore inspiration <ArrowRight size={18} /></button></div>
            )}
          </section>
        )}

        {surface === "plans" && (
          <section className="product-surface" id="top">
            <header className="surface-heading"><div><p className="eyebrow">Living itineraries</p><h1>Plans</h1><p>Saved ideas become plans; plans become requests without losing context.</p></div><button className="secondary-action" type="button" onClick={() => setPanel("context")}><SlidersHorizontal size={17} />Shape context</button></header>
            <div className="plan-workspace">
              <article className="plan-hero">
                <div className="plan-hero__image"><Image fill unoptimized src="/images/dinner-late-set.webp" alt="A couple at an intimate dinner planned in Soho" sizes="(max-width: 900px) 100vw, 52vw" /></div>
                <div className="plan-hero__body">
                  <div className="plan-kicker"><span>Tonight · London</span><span className="plan-state">Ready to request</span></div>
                  <h2>{heroCopy.title}</h2><p>{heroCopy.description}</p>
                  <div className="plan-summary"><span><Users size={16} />{bringFriends ? "Four guests" : "Aditya + Maya"}</span><span><Clock3 size={16} />3½ hours</span><span><MapPin size={16} />Soho</span></div>
                  <div className="plan-actions"><button className="primary-action" type="button" onClick={() => setPanel("detail")}>Review and request <ArrowRight size={18} /></button><button className="secondary-action" type="button" onClick={() => setPanel("context")}>Refine</button></div>
                </div>
              </article>
              <section className="plan-itinerary" aria-labelledby="plan-itinerary-title">
                <div><p className="eyebrow">What Aurora knows</p><h2 id="plan-itinerary-title">The evening, connected.</h2></div>
                <div className="plan-itinerary__steps">
                  {eveningPlan.map((step, index) => <div key={step.title}><span className="plan-step-number">0{index + 1}</span><time>{step.time}</time><strong>{step.title}</strong><small>{step.detail}</small><StatusLabel state={step.state} /></div>)}
                </div>
              </section>
              <section className="plan-memory"><div><p className="eyebrow">Context carried forward</p><h2>You won’t need to repeat the brief.</h2></div><ul><li><Check size={16} /><span><strong>Quiet table</strong><small>Preference memory · last used 12 July</small></span></li><li><Check size={16} /><span><strong>No shellfish</strong><small>Dining profile · confirmed by Aditya</small></span></li><li><Check size={16} /><span><strong>Maya joins after 7:30</strong><small>Shared availability · visible to both</small></span></li></ul></section>
            </div>
          </section>
        )}
      </main>

      {surface === "inspiration" && (
        <form className={`aurora-composer${chatInput.trim() ? " has-prompt" : ""}`} onSubmit={submitChat}>
          <span className="aurora-composer__label" aria-hidden="true">Aurora</span>
          <label className="sr-only" htmlFor="aurora-prompt">Ask Aurora to reshape your London edit</label>
          <input ref={composerInputRef} id="aurora-prompt" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Tell Aurora what to change" autoComplete="off" />
          <button type="submit" aria-label="Reshape the edit" disabled={!chatInput.trim()}><ArrowUpRight size={19} /></button>
        </form>
      )}

      <footer className="site-footer"><BrandMark /><p>Inspiration, planning and fulfilment—held in one private context.</p><p>Concept · 2026</p></footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button type="button" className={surface === "inspiration" ? "is-active" : ""} onClick={() => navigate("inspiration")}><SlidersHorizontal size={19} /><span>Inspiration</span></button>
        <button type="button" className={surface === "requests" ? "is-active" : ""} onClick={() => navigate("requests")}><MessageCircle size={19} /><span>Requests</span>{requests.length > 0 && <i>{requests.length}</i>}</button>
        <button type="button" className={surface === "plans" ? "is-active" : ""} onClick={() => navigate("plans")}><CalendarDays size={19} /><span>Plans</span></button>
      </nav>

      <Dialog.Root open={panelOpen} onOpenChange={(open) => !open && setPanel(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className={`dialog-content dialog-content--${panel ?? "default"}`} aria-describedby={undefined}>
            <Dialog.Title ref={panelTitleRef} className="sr-only" tabIndex={-1}>{panelTitle}</Dialog.Title>
            <Dialog.Close asChild><IconButton label="Close panel" className="dialog-close"><X size={20} /></IconButton></Dialog.Close>

            {panel === "detail" && (
              <div className="detail-panel panel-stage" key="detail">
                <div className="detail-panel__scroll">
                  <div className="detail-hero">
                    <Image fill unoptimized src="/images/dinner-late-set.webp" alt="A couple dining at an intimate candlelit restaurant" sizes="(max-width: 700px) 100vw, 620px" />
                    <span className="detail-hero__veil" /><div><p className="eyebrow">Tonight · Soho</p><h2>{heroCopy.title}</h2><p>{heroCopy.description}</p></div>
                  </div>
                  <div className="detail-body">
                    <div className="availability-callout"><AuroraSignal active /><span><strong>Available to request—not yet held.</strong>Mountain was checked at 6:42 PM. Ronnie Scott’s requires a custom access request.</span></div>
                    <section className="detail-section" aria-labelledby="timeline-title"><h3 id="timeline-title">The evening</h3><div className="timeline operational-timeline">
                      {eveningPlan.map((step) => <div className="timeline__item" key={step.title}><time>{step.time}</time><span><strong>{step.title}</strong><small>{step.detail}</small><StatusLabel state={step.state} /></span></div>)}
                    </div></section>
                    <section className="detail-section" aria-labelledby="why-title">
                      <div className="detail-section__heading"><h3 id="why-title">Why this fits</h3><button type="button" onClick={() => setPanel("context")}>Review signals</button></div>
                      <ul className="provenance-list">
                        <li><span className="provenance-check"><Check size={15} /></span><span><strong>You arrive at the hotel at 6:20 PM</strong><small>Calendar · synced 4 minutes ago · used for timing</small></span></li>
                        <li><span className="provenance-check"><Check size={15} /></span><span><strong>Maya is free after 7:30 PM</strong><small>Shared availability · visible to you and Maya</small></span></li>
                        <li><span className="provenance-check"><Check size={15} /></span><span><strong>Your first commitment tomorrow is at 10:00 AM</strong><small>Calendar · synced 4 minutes ago · used for pacing</small></span></li>
                        <li><span className="provenance-check"><Check size={15} /></span><span><strong>Quiet table · no shellfish</strong><small>Aurora memory · confirmed by you · last used 12 July</small></span></li>
                      </ul>
                      <p className="signal-disclosure">Only these signals were used for this edit. You can correct or disable any source.</p>
                    </section>
                  </div>
                </div>
                <div className="panel-actions"><button className="primary-action" type="button" onClick={() => setPanel("confirm")}>Send access request <ArrowRight size={18} /></button><button className={`secondary-action${sent ? " is-success" : ""}`} type="button" onClick={sendToMaya}><span className="button-state" key={sent ? "sent" : "send"}>{sent ? <Check size={18} /> : <Send size={18} />}{sent ? "Shared" : "Share"}</span></button></div>
              </div>
            )}

            {panel === "confirm" && (
              <div className="simple-panel confirmation-panel panel-stage" key="confirm">
                <button className="back-button" type="button" onClick={() => setPanel("detail")}><ArrowLeft size={18} />Back</button>
                <p className="eyebrow">Review the brief</p><h2>Send this request?</h2><p className="panel-intro">Aurora will ask both venues for availability. Nothing is reserved or charged until you approve confirmed holds, prices and terms.</p>
                <dl className="summary-list"><div><dt>For</dt><dd>{bringFriends ? "Aditya + Maya + 2 guests" : "Aditya + Maya"}</dd></div><div><dt>Mountain</dt><dd>Checked · not held</dd></div><div><dt>Ronnie Scott’s</dt><dd>Custom request required</dd></div><div><dt>Next update</dt><dd>Within 15 minutes</dd></div><div><dt>Payment</dt><dd>No charge before approval</dd></div></dl>
                <label className="note-field"><span>A note for Aurora <small>Optional</small></span><textarea value={requestNote} onChange={(event) => setRequestNote(event.target.value)} placeholder="Anything we should know?" rows={4} /></label>
                {requestError && <p className="request-error" role="alert">{requestError}</p>}
                <div className="reassurance"><Check size={16} />This creates a persistent request record.</div>
                <div className="panel-actions panel-actions--stacked"><button className="primary-action" type="button" onClick={() => void confirmRequest()} disabled={isConfirming} aria-busy={isConfirming}>{isConfirming ? <span className="button-state"><span className="button-spinner" aria-hidden="true" />Sending…</span> : <span className="button-state">Send request <ArrowRight size={18} /></span>}</button><button className="secondary-action" type="button" onClick={() => setPanel(null)}>Not yet</button></div>
              </div>
            )}

            {panel === "success" && (
              <div className="simple-panel success-panel panel-stage" key="success">
                <div className="success-mark"><Check size={30} strokeWidth={1.5} /></div><p className="eyebrow">Request sent · {currentRequest?.reference}</p><h2>Your timeline is live.</h2><p className="panel-intro">The Aurora London team owns the next step. You’ll see every access check, hold and approval here.</p>
                <div className="status-list" aria-live="polite"><div><span>Request record</span><small><i /> Created</small></div><div><span>Mountain</span><small><i /> Checking access</small></div><div><span>Ronnie Scott’s</span><small>Queued with venue</small></div><div><span>Your approval</span><small>After holds</small></div></div>
                <p className="no-charge"><Check size={16} />No charge has been made.</p>
                <div className="panel-actions panel-actions--stacked"><button className="primary-action" type="button" onClick={() => navigate("requests")}>Open request timeline <ArrowRight size={18} /></button><button className="secondary-action" type="button" onClick={() => setPanel(null)}>Keep exploring</button></div>
              </div>
            )}

            {panel === "context" && (
              <div className="simple-panel context-panel panel-stage" key="context">
                <p className="eyebrow">Personal context</p><h2>Shape your edit.</h2><p className="panel-intro">Adjust the signals behind this London edit. Aurora will show exactly what changed.</p>
                <div className="context-details">
                  {(["location", "time", "with"] as ContextKey[]).map((key) => (
                    <button key={key} type="button" aria-label={`Change ${contextSettingLabels[key]}, currently ${draftSettings[key]}`} onClick={() => cycleContextSetting(key)}><span>{key === "location" ? <MapPin size={18} /> : key === "time" ? <CalendarDays size={18} /> : <Users size={18} />}{contextSettingLabels[key]}</span><strong><span className="setting-value" key={draftSettings[key]}>{draftSettings[key]}</span><ChevronDown size={16} /></strong></button>
                  ))}
                </div>
                <fieldset className="intent-fieldset"><legend>What should this edit feel like?</legend><div>{contextOptions.map((option) => { const active = draftContexts.includes(option); return <button key={option} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => toggleDraftContext(option)}>{active && <Check size={15} />}{option}</button>; })}</div></fieldset>
                <section className="signal-ledger" aria-labelledby="signal-ledger-title"><div><h3 id="signal-ledger-title">Signals used for this edit</h3><small>Private by default</small></div><ul><li><span>Calendar</span><small>Timing · synced 4 min ago</small><button type="button">On</button></li><li><span>Shared availability</span><small>Maya · visible to both</small><button type="button">On</button></li><li><span>Preference memory</span><small>Dining + pace · corrected by you</small><button type="button">On</button></li></ul></section>
                <div className="panel-actions panel-actions--stacked"><button className="primary-action" type="button" onClick={() => applyEdit(draftContexts, draftSettings, "Your edit has been recomposed")}>Update inspiration <ArrowRight size={18} /></button></div>
              </div>
            )}

            {panel === "search" && (
              <div className="simple-panel search-panel panel-stage" key="search">
                <p className="eyebrow">Beyond the edit</p><h2>What are you looking for?</h2>
                <label className="search-field"><Search size={20} /><span className="sr-only">Search inspiration</span><input autoFocus value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="A place, feeling or idea" onKeyDown={(event) => { if (event.key !== "Enter" || !searchInput.trim()) return; event.preventDefault(); const query = searchInput; setSearchInput(""); curatePrompt(query); }} /></label>
                <div className="search-suggestions"><p>Try something considered</p>{["A private room for eight", "A restorative day near London", "Live music after dinner", "Somewhere worth flying for"].map((item) => <button key={item} type="button" onClick={() => { setSearchInput(""); curatePrompt(item); }}>{item}<ArrowUpRight size={17} /></button>)}</div>
              </div>
            )}

            {panel === "item" && selectedItem && (
              <div className="item-panel panel-stage" key={selectedItem.id}>
                <div className="item-panel__image"><Image fill unoptimized src={selectedItem.image} alt="" style={{ objectPosition: selectedItem.imagePosition }} sizes="(max-width: 700px) 100vw, 620px" /><span /></div>
                <div className="item-panel__body"><p className="eyebrow">{selectedItem.label}</p><h2>{selectedItem.title}</h2><p className="item-panel__lead">{selectedItem.detail}</p><div className="item-panel__facts"><span><Clock3 size={17} />{selectedItem.metadata}</span><span><AuroraSignal />{selectedItem.badge}</span></div><div className="why-now"><h3>Why this surfaced</h3><p>{selectedItem.provenance}</p><small className="provenance-source">Calendar · Aurora memory · editorial judgement</small></div></div>
                <div className="panel-actions"><button className="primary-action" type="button" onClick={() => { setPanel(null); setChatInput(`Can you arrange ${selectedItem.title.toLowerCase()}`); composerInputRef.current?.focus(); notify("Added to your Aurora prompt"); }}>Ask Aurora <MessageCircle size={18} /></button><button className={`secondary-action${savedItems.includes(selectedItem.id) ? " is-success" : ""}`} type="button" aria-pressed={savedItems.includes(selectedItem.id)} onClick={() => toggleSavedItem(selectedItem)}><span className="button-state" key={savedItems.includes(selectedItem.id) ? "saved" : "save"}>{savedItems.includes(selectedItem.id) ? <Check size={18} /> : <Bookmark size={18} />}{savedItems.includes(selectedItem.id) ? "Saved" : "Save"}</span></button></div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className={`toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">{toast && <AuroraSignal active />}<span>{toast}</span>{toast && <i className="toast__timer" key={toast} aria-hidden="true" />}</div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{isConfirming ? "Sending your request to Aurora." : panel === "success" ? "Request sent. Your request timeline is live." : ""}</div>
    </div>
  );
}
