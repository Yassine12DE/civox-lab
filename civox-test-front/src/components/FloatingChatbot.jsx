import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { OrgIcon } from "./organization/OrganizationUi";
import { sendChatMessage } from "../services/chatService";
import ChatStructuredResult from "./ChatStructuredResult";
import { getTokenRole } from "../utils/authToken";
import { getAccessToken } from "../utils/tokenStorage";
import "../styles/floatingChatbot.css";

const SUGGESTIONS = {
  CITIZEN: [
    "What can I participate in?",
    "Which surveys haven't I answered?",
    "What closes soon?",
    "Show my participation.",
  ],
  MANAGER: [
    "What can I do with my role?",
    "Which modules are enabled?",
    "Show open participation activities.",
    "How many organization users do we have?",
  ],
  ADMIN: [
    "Which modules are enabled?",
    "Show pending module requests.",
    "How many active users do we have?",
    "What can I do with my role?",
  ],
  MODERATOR: [
    "Which modules are enabled?",
    "Show pending module requests.",
    "What can I do with my role?",
  ],
  SUPER_ADMIN: [
    "What can I do with my role?",
    "Which modules are enabled?",
    "Show organization activity.",
  ],
};

const ANONYMOUS_SUGGESTIONS = [
  "What is CIVOX?",
  "What does this organization do?",
  "What modules are available?",
  "How can I participate?",
];

function FloatingChatbot() {
  const location = useLocation();
  const authenticated = Boolean(getAccessToken());
  const role = getTokenRole();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState("");
  const [loadingLabel, setLoadingLabel] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const sessionKey = `${authenticated ? "authenticated" : "anonymous"}:${role || "public"}`;

  const suggestions = useMemo(
    () => (authenticated ? SUGGESTIONS[role] || SUGGESTIONS.CITIZEN : ANONYMOUS_SUGGESTIONS),
    [authenticated, role]
  );

  useEffect(() => {
    setMessages([]);
    setError("");
    setInput("");
  }, [sessionKey]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true });
  }, [location.pathname, open]);

  async function submit(rawMessage, retry = false) {
    const message = rawMessage.trim();
    if (!message || loading) return;

    const sourceMessages = retry && messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages;
    const history = sourceMessages.map(({ role: messageRole, content }) => ({
      role: messageRole,
      content,
    }));
    if (!retry) setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setError("");
    setLastFailedMessage("");
    setLoadingLabel(authenticated && isStructuredQuestion(message) ? "Analyzing your CIVOX data…" : "");
    setLoading(true);

    try {
      const response = await sendChatMessage(message, history);
      setMessages((current) => [...current, { role: "assistant", content: response.reply, uiPayload: response.uiPayload || null }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "I couldn't load that result right now.");
      setLastFailedMessage(message);
    } finally {
      setLoading(false);
      setLoadingLabel("");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <aside className="civox-chat" aria-label={authenticated ? "CIVOX Copilot" : "CIVOX Assistant"}>
      {open && (
        <section
          className="civox-chat__panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="civox-chat-title"
          tabIndex={-1}
        >
          <header className="civox-chat__header">
            <span className="civox-chat__header-icon" aria-hidden="true">
              <OrgIcon name="sparkles" size={19} />
            </span>
            <div>
              <strong id="civox-chat-title">{authenticated ? "CIVOX Copilot" : "CIVOX Assistant"}</strong>
              <small>{authenticated ? "Secure organization assistant" : "Public CIVOX help"}</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close CIVOX chat">
              <OrgIcon name="x" size={19} />
            </button>
          </header>

          <div className="civox-chat__conversation" aria-live="polite" aria-busy={loading}>
            {messages.length === 0 && (
              <div className="civox-chat__welcome">
                <span><OrgIcon name="message" size={22} /></span>
                <h2>{authenticated ? "How can I help?" : "Welcome to CIVOX"}</h2>
                <p>
                  {authenticated
                    ? "Ask about your participation, enabled modules, permissions, or organization workspace."
                    : "Ask a general question about CIVOX and civic participation."}
                </p>
                <div className="civox-chat__suggestions" aria-label="Suggested questions">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => submit(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                className={`civox-chat__message civox-chat__message--${message.role} ${message.uiPayload ? "civox-chat__message--structured" : ""}`}
                key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
              >
                <div className="civox-chat__message-content">
                  <span>{message.content}</span>
                  {message.uiPayload && <ChatStructuredResult payload={message.uiPayload} />}
                </div>
              </div>
            ))}

            {loading && (
              loadingLabel ? (
                <div className="civox-chat__analysis-loading" aria-label={loadingLabel}>
                  <OrgIcon name="barChart" size={17} />
                  <div><strong>{loadingLabel}</strong><span /><span /></div>
                </div>
              ) : (
                <div className="civox-chat__message civox-chat__message--assistant civox-chat__typing" aria-label="Assistant is responding">
                  <i /><i /><i />
                </div>
              )
            )}
            {error && (
              <div className="civox-chat__error" role="alert">
                <OrgIcon name="alert" size={17} />
                <div><span>{error}</span>{lastFailedMessage && <button type="button" onClick={() => submit(lastFailedMessage, true)}>Try again</button>}</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="civox-chat__composer"
            onSubmit={(event) => {
              event.preventDefault();
              submit(input);
            }}
          >
            <label htmlFor="civox-chat-input" className="civox-chat__sr-only">Ask CIVOX a question</label>
            <textarea
              id="civox-chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              placeholder="Ask something..."
              disabled={loading}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(input);
                }
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
              <OrgIcon name="arrowUp" size={19} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="civox-chat__launcher"
        aria-label={open ? "Close CIVOX chat" : `Open ${authenticated ? "CIVOX Copilot" : "CIVOX Assistant"}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <OrgIcon name={open ? "x" : "message"} size={25} />
        {!open && <span aria-hidden="true">AI</span>}
      </button>
    </aside>
  );
}

function isStructuredQuestion(message) {
  return /(activity|overview|analytic|kpi|survey|result|user|module|participat|statistic|insight)/i.test(message);
}

export default FloatingChatbot;
