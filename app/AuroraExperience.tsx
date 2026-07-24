"use client";

import * as Dialog from "@radix-ui/react-dialog";
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

type Panel = "detail" | "confirm" | "success" | "context" | "search" | "item" | null;

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
};

const tomorrow: Experience[] = [
  {
    id: "recovery",
    image: "/images/sauna.jpg",
    label: "Recovery · 8:30 AM",
    title: "A quieter start.",
    body: "Hydrotherapy, sauna and a short treatment selected around your sleep and travel.",
    metadata: "Surrenne · Belgravia · 90 min",
    badge: "Member access",
    detail:
      "A private recovery circuit arranged for the morning after a late night, with your treatment preferences already shared.",
  },
  {
    id: "movement",
    image: "/images/london-arrival.jpg",
    imagePosition: "50% 60%",
    label: "Move · 9:00 AM",
    title: "Hyde Park, before the day begins.",
    body: "A private movement session from your hotel, with breakfast ready when you return.",
    metadata: "Door to door · 75 min",
    badge: "Fits your morning",
    detail:
      "Your trainer meets you at the hotel. The route, pace and breakfast timing flex around how you feel when you wake.",
  },
];

const discovery: Experience[] = [
  {
    id: "art",
    image: "/images/tate-performance.jpg",
    imagePosition: "50% 42%",
    label: "Art · South Bank",
    title: "Tate, after hours.",
    body: "A private walk through the galleries with a guide who knows where to pause.",
    metadata: "90 min · Up to 4 guests",
    badge: "Request access",
    detail:
      "A quiet route through the collection after public hours, shaped around the artists and movements you return to.",
  },
  {
    id: "lunch",
    image: "/images/candlelit-table.jpg",
    imagePosition: "45% 54%",
    label: "Lunch · Hammersmith",
    title: "Sunday at The River Café.",
    body: "A long table by the garden, kept open for whoever joins.",
    metadata: "2½ hours · Good for 4–6",
    badge: "Maya saved",
    detail:
      "A table that can expand as plans settle, with the kitchen briefed on everyone’s preferences before you arrive.",
  },
  {
    id: "escape",
    image: "/images/london-rain.jpg",
    imagePosition: "49% 54%",
    label: "Escape · Kent",
    title: "One night in Deal.",
    body: "Dinner downstairs, the sea in the morning, London before noon.",
    metadata: "1 night · Under 90 min by train",
    badge: "Fits 24–25 October",
    detail:
      "An overnight that feels longer than it is: late train out, a room above dinner, and a clean return before Monday begins.",
  },
];

const contextOptions = ["Keep it close", "Bring friends", "Slow tomorrow down", "Something new"];

function AuroraRing({ active = false }: { active?: boolean }) {
  return <span className={`aurora-ring${active ? " is-active" : ""}`} aria-hidden="true" />;
}

function IconButton({
  label,
  children,
  onClick,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function ExperienceCard({
  item,
  onOpen,
  size = "standard",
  index = 0,
}: {
  item: Experience;
  onOpen: (item: Experience) => void;
  size?: "standard" | "compact";
  index?: number;
}) {
  return (
    <button
      className={`experience-card experience-card--${size}`}
      type="button"
      onClick={() => onOpen(item)}
      style={{ "--card-delay": `${index * 70}ms` } as React.CSSProperties}
      aria-label={`Open ${item.title}`}
    >
      <img
        src={item.image}
        alt=""
        className="experience-card__image"
        style={{ objectPosition: item.imagePosition }}
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
  );
}

export function AuroraExperience() {
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedItem, setSelectedItem] = useState<Experience | null>(null);
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [activeContexts, setActiveContexts] = useState<string[]>(["Slow tomorrow down"]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panelOpen = panel !== null;

  const panelTitle = useMemo(() => {
    if (panel === "detail") return "Dinner, then the late set.";
    if (panel === "confirm") return "Arrange this evening?";
    if (panel === "success") return "We’re arranging your evening.";
    if (panel === "context") return "Shape your context";
    if (panel === "search") return "Search inspiration";
    if (panel === "item") return selectedItem?.title ?? "Experience";
    return "Aurora";
  }, [panel, selectedItem]);

  function notify(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function openExperience(item: Experience) {
    setSelectedItem(item);
    setPanel("item");
  }

  function toggleSaved() {
    setSaved((current) => {
      notify(current ? "Removed from saved" : "Saved to London");
      return !current;
    });
  }

  function sendToMaya() {
    setSent(true);
    notify("Sent privately to Maya");
  }

  function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    setChatInput("");
    notify(`Aurora is considering “${message}”`);
  }

  function toggleContext(option: string) {
    setActiveContexts((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  return (
    <div className="aurora-app">
      <a className="skip-link" href="#main-content">
        Skip to inspiration
      </a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Aurora home">
          <img src="/aurora-logo.png" alt="Aurora" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className="is-active" href="#inspiration">
            Inspiration
          </a>
          <button type="button" onClick={() => notify("Your open requests are up to date")}>Requests</button>
          <button type="button" onClick={() => notify("Your London plan is ready")}>Plans</button>
        </nav>
        <div className="header-actions">
          <IconButton label="Search inspiration" onClick={() => setPanel("search")}>
            <Search size={20} strokeWidth={1.6} />
          </IconButton>
          <button className="profile-button" type="button" onClick={() => notify("Member profile") } aria-label="Open member profile">
            A
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="intro" id="top">
          <div className="intro__context">
            <span>Friday</span>
            <span className="intro__dot" />
            <span>London</span>
          </div>
          <div className="intro__heading-row">
            <div>
              <h1>Good evening, Aditya.</h1>
              <p>A few ideas that fit the time you have.</p>
            </div>
            <button className="edit-context" type="button" onClick={() => setPanel("context")}>
              <SlidersHorizontal size={17} strokeWidth={1.6} />
              Shape the edit
            </button>
          </div>
          <div className="context-strip" aria-label="Current personal context">
            <button type="button" onClick={() => setPanel("context")}>
              <MapPin size={16} />
              In London
            </button>
            <button type="button" onClick={() => setPanel("context")}>
              <CalendarDays size={16} />
              Until Sunday, 8:00 PM
            </button>
            <button type="button" onClick={() => setPanel("context")}>
              <Users size={16} />
              With Maya
            </button>
          </div>
        </section>

        <section className="hero-section" id="inspiration" aria-labelledby="hero-title">
          <div className="hero-card">
            <img src="/images/private-dinner.jpg" alt="Friends gathered around an intimate candlelit table" />
            <span className="hero-card__light" />
            <span className="hero-card__veil" />
            <div className="hero-card__status">
              <AuroraRing active />
              <span>Aurora can arrange · Tonight</span>
            </div>
            <div className="hero-card__copy">
              <p className="eyebrow">A considered evening in Soho</p>
              <h2 id="hero-title">Dinner, then the late set.</h2>
              <p className="hero-card__description">
                Mountain at 8:15. Ronnie Scott’s at 10:30. Four minutes between them, with enough room to linger.
              </p>
              <div className="hero-card__meta">
                <span><MapPin size={16} /> Soho</span>
                <span><Clock3 size={16} /> 3½ hours</span>
                <span><Check size={16} /> Fits before 10:00 AM tomorrow</span>
              </div>
              <div className="hero-card__actions">
                <button className="primary-action" type="button" onClick={() => setPanel("detail")}>
                  See the evening
                  <ArrowRight size={18} />
                </button>
                <button className="secondary-action" type="button" onClick={sendToMaya}>
                  {sent ? <Check size={18} /> : <Send size={18} />}
                  {sent ? "Sent to Maya" : "Send to Maya"}
                </button>
                <IconButton label={saved ? "Remove saved plan" : "Save this plan"} onClick={toggleSaved} className={saved ? "is-selected" : ""}>
                  <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
                </IconButton>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section" aria-labelledby="tomorrow-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your next clear window</p>
              <h2 id="tomorrow-title">For tomorrow morning</h2>
            </div>
            <p>Designed around a late night.</p>
          </div>
          <div className="tomorrow-grid">
            {tomorrow.map((item, index) => (
              <ExperienceCard key={item.id} item={item} onOpen={openExperience} index={index} />
            ))}
          </div>
        </section>

        <section className="content-section" aria-labelledby="together-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Built from your shared saves</p>
              <h2 id="together-title">Better together</h2>
            </div>
            <div className="shared-avatars" aria-label="Aditya and Maya, three shared saves">
              <span>A</span>
              <span>M</span>
              <small>3 shared saves</small>
            </div>
          </div>
          <button
            className="weekend-card"
            type="button"
            onClick={() =>
              openExperience({
                id: "bruton",
                image: "/images/bruton-manor.jpg",
                imagePosition: "50% 54%",
                label: "A weekend to keep",
                title: "Forty-eight hours in Bruton.",
                body: "Art, long lunches and nowhere else to be.",
                metadata: "17–19 October · 2 hr 5 min from London",
                badge: "3 shared saves",
                detail: "A countryside weekend drawn from the places you and Maya have both kept returning to.",
              })
            }
          >
            <img src="/images/bruton-manor.jpg" alt="An English manor set within a quiet country landscape" />
            <span className="weekend-card__veil" />
            <span className="weekend-card__copy">
              <span className="eyebrow">A weekend to keep</span>
              <strong>Forty-eight hours in Bruton.</strong>
              <span>Art, long lunches and nowhere else to be.</span>
              <span className="weekend-card__meta">17–19 October · 2 hr 5 min from London</span>
            </span>
            <span className="weekend-card__action">Open the weekend <ArrowUpRight size={18} /></span>
          </button>
        </section>

        <section className="content-section" aria-labelledby="discovery-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A little further out</p>
              <h2 id="discovery-title">Worth making room for</h2>
            </div>
            <button className="text-action" type="button" onClick={() => setPanel("search")}>
              Explore all <ArrowRight size={17} />
            </button>
          </div>
          <div className="discovery-grid">
            {discovery.map((item, index) => (
              <ExperienceCard key={item.id} item={item} onOpen={openExperience} size="compact" index={index} />
            ))}
          </div>
        </section>

        <section className="shape-section" aria-labelledby="shape-title">
          <div className="shape-section__presence">
            <AuroraRing active />
          </div>
          <p className="eyebrow">A living edit</p>
          <h2 id="shape-title">Shape what comes next.</h2>
          <p>More energy, less travel, somewhere private—tell Aurora what to change.</p>
          <div className="suggestion-row">
            {contextOptions.slice(0, 3).map((item) => (
              <button key={item} type="button" onClick={() => {
                setChatInput(item);
                notify(`Added “${item}” to your prompt`);
              }}>
                {item}
              </button>
            ))}
          </div>
        </section>
      </main>

      <form className="aurora-composer" onSubmit={submitChat}>
        <AuroraRing active />
        <label className="sr-only" htmlFor="aurora-prompt">Ask Aurora about London</label>
        <input
          id="aurora-prompt"
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder="Ask Aurora about London"
          autoComplete="off"
        />
        <button type="submit" aria-label="Send to Aurora" disabled={!chatInput.trim()}>
          <ArrowUpRight size={19} />
        </button>
      </form>

      <footer className="site-footer">
        <img src="/aurora-logo.png" alt="Aurora" />
        <p>A prototype of Inspiration, designed around the member’s life.</p>
        <p>Concept · 2026</p>
      </footer>

      <Dialog.Root open={panelOpen} onOpenChange={(open) => !open && setPanel(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className={`dialog-content dialog-content--${panel ?? "default"}`} aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{panelTitle}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close panel" className="dialog-close">
                <X size={20} />
              </IconButton>
            </Dialog.Close>

            {panel === "detail" && (
              <div className="detail-panel">
                <div className="detail-hero">
                  <img src="/images/private-dinner.jpg" alt="Friends gathered around an intimate candlelit table" />
                  <span className="detail-hero__veil" />
                  <div>
                    <p className="eyebrow">Tonight · Soho</p>
                    <h2>Dinner, then the late set.</h2>
                    <p>Start at Mountain at 8:15, then walk four minutes to Ronnie Scott’s. We’ll leave the end of the night open.</p>
                  </div>
                </div>
                <div className="detail-body">
                  <div className="availability-callout">
                    <AuroraRing active />
                    <span><strong>Aurora can currently arrange both stops.</strong> Availability was checked 2 minutes ago.</span>
                  </div>
                  <section className="detail-section" aria-labelledby="timeline-title">
                    <h3 id="timeline-title">The evening</h3>
                    <div className="timeline">
                      <div className="timeline__item">
                        <time>8:15 PM</time>
                        <span><strong>Mountain</strong><small>Dinner · table for two</small></span>
                      </div>
                      <div className="timeline__item">
                        <time>10:30 PM</time>
                        <span><strong>Ronnie Scott’s</strong><small>Late set · table for two</small></span>
                      </div>
                      <div className="timeline__item">
                        <time>After</time>
                        <span><strong>Your call</strong><small>A car will be ready when you are</small></span>
                      </div>
                    </div>
                  </section>
                  <section className="detail-section" aria-labelledby="why-title">
                    <h3 id="why-title">Why this fits</h3>
                    <ul className="reason-list">
                      <li><Check size={16} /> You arrive at the hotel at 6:20 PM</li>
                      <li><Check size={16} /> Maya is free after 7:30 PM</li>
                      <li><Check size={16} /> Your first commitment tomorrow is at 10:00 AM</li>
                    </ul>
                    <div className="preference-row">
                      <span>Quiet table</span><span>No shellfish</span>
                    </div>
                  </section>
                </div>
                <div className="panel-actions">
                  <button className="primary-action" type="button" onClick={() => setPanel("confirm")}>
                    Ask Aurora to arrange <ArrowRight size={18} />
                  </button>
                  <button className="secondary-action" type="button" onClick={sendToMaya}>
                    {sent ? <Check size={18} /> : <Send size={18} />} {sent ? "Sent" : "Send to Maya"}
                  </button>
                </div>
              </div>
            )}

            {panel === "confirm" && (
              <div className="simple-panel confirmation-panel">
                <button className="back-button" type="button" onClick={() => setPanel("detail")}>
                  <ArrowLeft size={18} /> Back
                </button>
                <p className="eyebrow">One last look</p>
                <h2>Arrange this evening?</h2>
                <p className="panel-intro">We’ll confirm both stops and coordinate the details. Nothing is charged until you approve.</p>
                <dl className="summary-list">
                  <div><dt>For</dt><dd>Aditya + Maya</dd></div>
                  <div><dt>Dinner</dt><dd>8:15 PM · Mountain</dd></div>
                  <div><dt>Late set</dt><dd>10:30 PM · Ronnie Scott’s</dd></div>
                  <div><dt>Return</dt><dd>Car on request</dd></div>
                  <div><dt>Preferences</dt><dd>Quiet table · No shellfish</dd></div>
                </dl>
                <label className="note-field">
                  <span>A note for Aurora <small>Optional</small></span>
                  <textarea placeholder="Anything we should know?" rows={4} />
                </label>
                <div className="reassurance"><Check size={16} /> No charge will be made yet.</div>
                <div className="panel-actions panel-actions--stacked">
                  <button className="primary-action" type="button" onClick={() => setPanel("success")}>
                    Confirm request <ArrowRight size={18} />
                  </button>
                  <button className="secondary-action" type="button" onClick={() => setPanel(null)}>Not yet</button>
                </div>
              </div>
            )}

            {panel === "success" && (
              <div className="simple-panel success-panel">
                <div className="success-mark"><AuroraRing active /></div>
                <p className="eyebrow">Request received</p>
                <h2>We’re arranging your evening.</h2>
                <p className="panel-intro">Aurora is checking both stops now. We’ll update you here within 15 minutes.</p>
                <div className="status-list" aria-live="polite">
                  <div><span>Mountain</span><small><i /> Checking</small></div>
                  <div><span>Ronnie Scott’s</span><small><i /> Checking</small></div>
                  <div><span>Car</span><small>Added after confirmations</small></div>
                </div>
                <p className="no-charge"><Check size={16} /> No charge has been made.</p>
                <div className="panel-actions panel-actions--stacked">
                  <button className="primary-action" type="button" onClick={() => { setPanel(null); notify("Request opened in your timeline"); }}>
                    Open request <ArrowRight size={18} />
                  </button>
                  <button className="secondary-action" type="button" onClick={() => setPanel(null)}>Keep exploring</button>
                </div>
              </div>
            )}

            {panel === "context" && (
              <div className="simple-panel context-panel">
                <p className="eyebrow">Personal context</p>
                <h2>Shape your edit.</h2>
                <p className="panel-intro">Aurora uses only what is useful now. Adjust the signals behind this London edit.</p>
                <div className="context-details">
                  <button type="button"><span><MapPin size={18} /> Location</span><strong>London <ChevronDown size={16} /></strong></button>
                  <button type="button"><span><CalendarDays size={18} /> Time</span><strong>Until Sun, 8:00 PM <ChevronDown size={16} /></strong></button>
                  <button type="button"><span><Users size={18} /> With</span><strong>Maya <ChevronDown size={16} /></strong></button>
                </div>
                <fieldset className="intent-fieldset">
                  <legend>What should this edit feel like?</legend>
                  <div>
                    {contextOptions.map((option) => {
                      const active = activeContexts.includes(option);
                      return (
                        <button key={option} type="button" aria-pressed={active} className={active ? "is-active" : ""} onClick={() => toggleContext(option)}>
                          {active && <Check size={15} />} {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="panel-actions panel-actions--stacked">
                  <button className="primary-action" type="button" onClick={() => { setPanel(null); notify("Your edit has been reshaped"); }}>
                    Update inspiration <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {panel === "search" && (
              <div className="simple-panel search-panel">
                <p className="eyebrow">Beyond the edit</p>
                <h2>What are you looking for?</h2>
                <label className="search-field">
                  <Search size={20} />
                  <span className="sr-only">Search inspiration</span>
                  <input autoFocus placeholder="A place, feeling or idea" onKeyDown={(event) => {
                    if (event.key === "Enter") { setPanel(null); notify("Aurora is curating new ideas"); }
                  }} />
                </label>
                <div className="search-suggestions">
                  <p>Try something considered</p>
                  {["A private room for eight", "A restorative day near London", "Live music after dinner", "Somewhere worth flying for"].map((item) => (
                    <button key={item} type="button" onClick={() => { setPanel(null); setChatInput(item); notify(`Added “${item}” to your prompt`); }}>
                      {item}<ArrowUpRight size={17} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {panel === "item" && selectedItem && (
              <div className="item-panel">
                <div className="item-panel__image">
                  <img src={selectedItem.image} alt="" style={{ objectPosition: selectedItem.imagePosition }} />
                  <span />
                </div>
                <div className="item-panel__body">
                  <p className="eyebrow">{selectedItem.label}</p>
                  <h2>{selectedItem.title}</h2>
                  <p className="item-panel__lead">{selectedItem.detail}</p>
                  <div className="item-panel__facts">
                    <span><Clock3 size={17} /> {selectedItem.metadata}</span>
                    <span><AuroraRing /> {selectedItem.badge}</span>
                  </div>
                  <div className="why-now">
                    <h3>Why now</h3>
                    <p>It fits cleanly around what is already in your calendar, without asking the rest of the day to move.</p>
                  </div>
                </div>
                <div className="panel-actions">
                  <button className="primary-action" type="button" onClick={() => { setPanel(null); setChatInput(`Can you arrange ${selectedItem.title.toLowerCase()}`); notify("Added to your Aurora prompt"); }}>
                    Ask Aurora <MessageCircle size={18} />
                  </button>
                  <button className="secondary-action" type="button" onClick={() => notify("Saved to London")}><Bookmark size={18} /> Save</button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className={`toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">
        <AuroraRing active />
        <span>{toast}</span>
      </div>
    </div>
  );
}
