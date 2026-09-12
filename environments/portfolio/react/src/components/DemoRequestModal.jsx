import { useState } from 'react'
import Modal from './Modal'
import {
  DEMO_CONTACT_EMAIL,
  DEMO_REQUEST_ENDPOINT,
  PROVISION_ETA,
} from '../config/demoMode'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildMailto({ name, email, company, note }) {
  const subject = `Demo request — ${name}${company ? ` (${company})` : ''}`
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    company ? `Company: ${company}` : null,
    '',
    note || '(no message)',
  ]
    .filter((l) => l !== null)
    .join('\n')

  return `mailto:${DEMO_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
        {label}
        {hint && <span className="text-[var(--color-text-tertiary)]"> · {hint}</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent)] transition-colors'

export default function DemoRequestModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', note: '' })
  const [trap, setTrap] = useState('') // honeypot — real users never fill this
  const [state, setState] = useState('editing') // editing | sending | sent | mailto | error
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Required'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (state === 'sending') return
    if (!validate()) return
    if (trap) return onClose() // silently drop bots

    // No API yet → hand off to the visitor's mail client.
    if (!DEMO_REQUEST_ENDPOINT) {
      window.location.href = buildMailto(form)
      setState('mailto')
      return
    }

    setState('sending')
    try {
      const res = await fetch(DEMO_REQUEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setState('sent')
    } catch {
      setState('error')
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(DEMO_CONTACT_EMAIL)
    } catch {
      /* clipboard blocked — the address is visible on screen anyway */
    }
  }

  /* ── Confirmation states ─────────────────────────────────────────── */
  if (state === 'sent' || state === 'mailto') {
    return (
      <Modal title="Demo requested" onClose={onClose}>
        <div className="flex flex-col items-center text-center gap-3 py-4 max-w-md mx-auto">
          <i className="ti ti-mail-check text-3xl text-[var(--color-accent)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-primary)]">
            {state === 'sent'
              ? 'Request received.'
              : 'Your mail app should be opening with the request ready to send.'}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Once it reaches me I kick off the build — the cluster and telemetry pipelines
            take {PROVISION_ETA} to come up, then you get a link with credentials.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <span>
              {state === 'mailto' ? 'No mail app? Write to' : 'Questions?'} {DEMO_CONTACT_EMAIL}
            </span>
            <button
              onClick={copyAddress}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
            >
              <i className="ti ti-copy text-xs" aria-hidden="true" />
              Copy
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 text-sm rounded-xl bg-[var(--color-accent)] text-[#0b0d10] px-5 py-2.5 font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </Modal>
    )
  }

  /* ── Form ────────────────────────────────────────────────────────── */
  return (
    <Modal title="Request a demo" onClose={onClose}>
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Tell me where to send the link. I build the stack on request rather than leaving it
          running, so expect a reply with a live URL and read-only Grafana credentials.
        </p>

        <Field label="Name">
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Alex Rivera"
            className={inputClass}
            autoComplete="name"
          />
          {errors.name && <span className="block text-xs text-[#f87171] mt-1">{errors.name}</span>}
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="alex@company.com"
            className={inputClass}
            autoComplete="email"
          />
          {errors.email && <span className="block text-xs text-[#f87171] mt-1">{errors.email}</span>}
        </Field>

        <Field label="Company" hint="optional">
          <input
            type="text"
            value={form.company}
            onChange={set('company')}
            placeholder="Acme"
            className={inputClass}
            autoComplete="organization"
          />
        </Field>

        <Field label="Anything you want to see" hint="optional">
          <textarea
            rows={3}
            value={form.note}
            onChange={set('note')}
            placeholder="Interested in the SLO burn-rate alerting and how traces link to logs."
            className={`${inputClass} resize-none leading-relaxed`}
          />
        </Field>

        {/* Honeypot — hidden from humans, catches naive bots */}
        <input
          type="text"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        {state === 'error' && (
          <p className="text-xs text-[#f87171]">
            That did not go through. Try again, or write to {DEMO_CONTACT_EMAIL} directly.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={state === 'sending'}
            className="inline-flex items-center gap-2 text-sm rounded-xl bg-[var(--color-accent)] text-[#0b0d10] px-5 py-2.5 font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {state === 'sending' ? (
              <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true" />
            ) : (
              <i className="ti ti-send text-base" aria-hidden="true" />
            )}
            Send request
          </button>
        </div>
      </div>
    </Modal>
  )
}
