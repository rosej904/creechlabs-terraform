import { useState, useEffect, useRef, lazy, Suspense } from 'react'
const ReactMarkdown = lazy(() => import('react-markdown'))
import GrafanaChatPanel from './GrafanaChatPanel'

const API_URL     = '/api/chat'
const ANRI_IMAGE  = '/images/anri.png'

const TILT_STYLE = `
  @keyframes headtilt {
    0%, 100% { transform: rotate(0deg); }
    25%       { transform: rotate(-4deg); }
    75%       { transform: rotate(4deg);  }
  }
  .anri-tilt {
    animation: headtilt 0.9s ease-in-out;
    transform-origin: center bottom;
  }
`

const SUGGESTIONS = [
  'What is the current error rate for the checkout service?',
  'Are there any active SLO burn alerts right now?',
  'Show me p99 latency for the frontend service',
]

// ─── Inline head for assistant replies ───────────────────────────────────────
function AnriHead({ size = 36 }) {
  return (
    <img
      src={ANRI_IMAGE}
      alt="Anri"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  )
}

// ─── Circular avatar for chat header ─────────────────────────────────────────
function AnriAvatar({ size = 32 }) {
  return (
    <img
      src={ANRI_IMAGE}
      alt="Anri"
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

// ─── Chat message ─────────────────────────────────────────────────────────────
function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <AnriHead size={34} />}
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
        isUser
          ? 'bg-[var(--color-accent)] text-[#0b0d10] rounded-tr-sm'
          : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-tl-sm'
      }`}>
        {isUser ? content : (
          <Suspense fallback={<span>{content}</span>}>
            <ReactMarkdown
            components={{
              p:      ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({children}) => <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>,
              ul:     ({children}) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
              ol:     ({children}) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
              li:     ({children}) => <li className="text-sm">{children}</li>,
              code:   ({children}) => <code className="bg-[var(--color-bg)] rounded px-1 py-0.5 text-xs font-mono text-[var(--color-accent)]">{children}</code>,
              a:      ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] underline underline-offset-2">{children}</a>,
              h3:     ({children}) => <p className="font-semibold text-[var(--color-text-primary)] mt-1 mb-0.5">{children}</p>,
            }}
          >
            {content}
          </ReactMarkdown>
          </Suspense>
        )}
      </div>
    </div>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function AnriWidget({ grafanaStatus, bubbleStyle }) {
  const [open, setOpen]         = useState(false)
  const [visible, setVisible]   = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [quota, setQuota]     = useState(null)
  const [tilting, setTilting] = useState(true) // start tilting immediately
  const messagesEndRef         = useRef(null)
  const inputRef               = useRef(null)

  // Loop tilt every 5s
  useEffect(() => {
    if (open) return
    const interval = setInterval(() => {
      setTilting(false)
      requestAnimationFrame(() => {
        setTimeout(() => setTilting(true), 20) // brief off to restart animation
      })
    }, 5000)
    // Initial tilt on mount
    const initial = setTimeout(() => setTilting(false), 900)
    return () => { clearInterval(interval); clearTimeout(initial) }
  }, [open])

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  function handleOpen() { setOpen(true) }

  function handleClose() {
    setVisible(false)
    setTimeout(() => setOpen(false), 250)
  }

  async function sendMessage(text) {
    const userText = text.trim()
    if (!userText || loading) return
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res  = await fetch(API_URL, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Caller-Key': import.meta.env.VITE_CALLER_KEY ?? '',
        },
        body:    JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (res.status === 429 || data.quota_exhausted) {
        setMessages((m) => [...m, { role: 'assistant', content: "I've reached my daily usage limit. Check back tomorrow!" }])
      } else if (data.reply) {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
        if (data.tokens_remaining_today !== undefined) setQuota(data.tokens_remaining_today)
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <>
      <style>{TILT_STYLE}</style>

      {open && (
        <>
          {/* Solid backdrop */}
          <div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9998 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed bottom-6 right-6 border border-[var(--color-border)] rounded-2xl flex overflow-hidden transition-all duration-[250ms] ease-out"
            style={{
              zIndex:          9999,
              width:           'min(860px, calc(100vw - 3rem))',
              height:          'min(760px, calc(100dvh - 5rem))',
              transformOrigin: 'bottom right',
              transform:       visible ? 'scale(1)' : 'scale(0.15)',
              opacity:         visible ? 1 : 0,
              boxShadow:       '0 0 0 1px rgba(79,209,197,0.12), 0 8px 40px rgba(0,0,0,0.6), 0 2px 12px rgba(79,209,197,0.06)',
              backgroundColor: '#0d1117',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left — GrafanaChatPanel (desktop only) */}
            <div className="hidden md:flex flex-col flex-1 min-w-0 border-r border-[var(--color-border)]">
              <GrafanaChatPanel status={{ apps: { detail: { grafana: { status: grafanaStatus } } } }} />
            </div>

            {/* Right — Chat */}
            <div className="flex flex-col w-full md:w-[320px] shrink-0">
              {/* Header — text only, no avatar */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--color-border)] shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">Ask Anri</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    Observability assistant{quota !== null ? ` · ${quota.toLocaleString()} tokens left` : ''}
                  </p>
                </div>
                <button onClick={handleClose} aria-label="Close"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                  <i className="ti ti-x text-sm" aria-hidden="true" />
                </button>
              </div>

              {/* Mobile tip */}
              <div className="md:hidden mx-4 mt-3 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center gap-2">
                <i className="ti ti-device-desktop text-sm text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                <p className="text-xs text-[var(--color-text-secondary)] leading-snug">
                  Visit on desktop to see the live Grafana dashboard alongside this chat.
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Try asking:</p>
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="text-left text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors leading-relaxed">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
                {loading && (
                  <div className="flex gap-2 items-end">
                    <AnriHead size={34} />
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                      {[0,1,2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce"
                          style={{ animationDelay: `${i*150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 p-3 border-t border-[var(--color-border)]">
                <div className="flex gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 focus-within:border-[var(--color-accent)] transition-colors">
                  <textarea ref={inputRef} rows={1} value={input}
                    onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ask about metrics, alerts, traces…"
                    className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] resize-none outline-none leading-relaxed"
                    style={{ maxHeight: '96px' }} />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} aria-label="Send"
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-accent)] text-[#0b0d10] disabled:opacity-40 hover:opacity-90 transition-opacity self-end">
                    <i className="ti ti-send text-sm" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Floating head ───────────────────────────────────────────────────── */}
      <div
        className={bubbleStyle ? '' : 'fixed bottom-6 right-6 z-50'}
        style={bubbleStyle}
      >
        {!open && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">Ask Anri</span>
            <button
              onClick={handleOpen}
              aria-label="Open Anri chat"
              className={tilting ? 'anri-tilt' : ''}
              style={{
                background: 'none',
                border:     'none',
                padding:    0,
                cursor:     'pointer',
                filter:     'drop-shadow(0 0 8px rgba(79,209,197,0.55)) drop-shadow(0 0 2px rgba(79,209,197,0.9))',
                transition: 'filter 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(79,209,197,0.8)) drop-shadow(0 0 4px rgba(79,209,197,1))' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(79,209,197,0.55)) drop-shadow(0 0 2px rgba(79,209,197,0.9))' }}
            >
              <img src={ANRI_IMAGE} alt="Ask Anri" style={{ display: 'block', width: 80, height: 80, objectFit: 'contain' }} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}


