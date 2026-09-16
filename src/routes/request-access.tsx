import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Banknote, Copy, CreditCard, Sparkles, Wallet } from "lucide-react";
import { AcademyMark } from "@/components/academy-mark";
import { JoinWhatsApp } from "@/components/whatsapp-join";
import { QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { getGateState, listSignupRails, submitEnrollment } from "@/lib/academy-api";
import { submitCampusEnrollment } from "@/lib/campus-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BOOK } from "@/lib/book-public";
import {
  RAIL_CATEGORIES,
  SIGNUP_RAILS,
  SKRILL_ACCOUNT,
  SKRILL_CHECKOUT,
  SKRILL_EMAIL,
  SKRILL_SEND_MONEY,
  SKRILL_STATUS_PATH,
  STUDENT_BATCHES,
  skrillPersonName,
  skrillTxId,
  type RailCategory,
  type SignupRail,
} from "@/lib/signup-rails";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/request-access")({ component: RequestAccess });

const DRAFT_KEY = "aea.payDraft";

type PayDraft = {
  name: string;
  phone: string;
  handle: string;
  batch: (typeof STUDENT_BATCHES)[number];
  txId: string;
};

function readDraft(): PayDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PayDraft;
  } catch {
    return null;
  }
}

function writeDraft(draft: PayDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

async function copyText(value: string, ok: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(ok);
  } catch {
    toast.error("Copy failed — select the text instead.");
  }
}

function RequestAccess() {
  const { user } = useCurrentUserState();
  const [step, setStep] = useState<"identity" | "pay" | "sent">("identity");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [handle, setHandle] = useState("");
  const [batch, setBatch] = useState<(typeof STUDENT_BATCHES)[number]>("Cohort 1");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState<string>(BOOK.priceNgn);
  const [priceUsd, setPriceUsd] = useState(BOOK.priceUsd.replace(/[^\d.]/g, "") || "3.78");
  const [rails, setRails] = useState<SignupRail[]>(SIGNUP_RAILS);
  const [category, setCategory] = useState<RailCategory>("skrill");
  const [methodId, setMethodId] = useState(SIGNUP_RAILS[0]?.id ?? "skrill");
  const [txId, setTxId] = useState("");

  useEffect(() => {
    const draft = readDraft();
    const paid = new URLSearchParams(window.location.search).get("skrill") === "1";
    if (draft) {
      setName(draft.name);
      setPhone(draft.phone);
      setHandle(draft.handle);
      if (STUDENT_BATCHES.includes(draft.batch)) setBatch(draft.batch);
      setTxId(draft.txId);
      setRef(draft.txId);
      if (paid) {
        setStep("pay");
        toast.success("If Skrill confirmed the payment, paste the transaction id below and submit.");
      }
    } else {
      setTxId(skrillTxId());
    }
    void getGateState()
      .then((g) => {
        setPrice(`₦${g.priceNgn.toLocaleString()} (approx. US$${g.priceUsd})`);
        setPriceUsd(g.priceUsd);
      })
      .catch(() => undefined);
    void listSignupRails()
      .then((r) => {
        if (r.rails.length) {
          setRails(r.rails);
          const first = r.rails.find((m) => m.category === "skrill") ?? r.rails[0];
          if (first) {
            setMethodId(first.id);
            setCategory(first.category);
          }
        }
        if (r.priceNgn) setPrice(`₦${r.priceNgn.toLocaleString()} (approx. US$${r.priceUsd})`);
        if (r.priceUsd) setPriceUsd(r.priceUsd);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.displayName) setName((n) => n || user.displayName || "");
  }, [user]);

  const visibleCats = useMemo(
    () => RAIL_CATEGORIES.filter((c) => rails.some((r) => r.category === c.id)),
    [rails],
  );
  const inCategory = useMemo(
    () => rails.filter((r) => r.category === category),
    [rails, category],
  );
  const selected = rails.find((m) => m.id === methodId) ?? inCategory[0];
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const returnUrl = origin ? `${origin}/request-access?skrill=1` : "/request-access?skrill=1";
  const cancelUrl = origin ? `${origin}/request-access` : "/request-access";
  const statusUrl = origin ? `${origin}${SKRILL_STATUS_PATH}` : SKRILL_STATUS_PATH;
  const person = skrillPersonName(name);
  const amount = Number.parseFloat(priceUsd) > 0 ? Number.parseFloat(priceUsd).toFixed(2) : "3.78";
  const payFromEmail = (user?.primaryEmail ?? "").trim();

  function goPay() {
    if (name.trim().length < 2) {
      toast.error("Add your name.");
      return;
    }
    if (phone.trim().length < 8) {
      toast.error("Add a phone number the author can reach.");
      return;
    }
    if (handle.trim().replace(/^@+/, "").length < 1) {
      toast.error("Add your X handle.");
      return;
    }
    const id = txId || skrillTxId();
    setTxId(id);
    setRef((current) => current || id);
    writeDraft({ name: name.trim(), phone: phone.trim(), handle: handle.trim(), batch, txId: id });
    const first = rails.find((m) => m.category === category) ?? rails[0];
    if (first) setMethodId(first.id);
    setStep("pay");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Choose a payment option.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        studentName: name,
        phone,
        xHandle: handle,
        batch,
        methodId: selected.id,
        paymentRef: ref,
        note,
      };
      if (user) {
        await submitCampusEnrollment({ data: payload });
      } else {
        await submitEnrollment({ data: payload });
      }
      setStep("sent");
      toast.success(
        user
          ? "Enrollment received. When the author confirms, class opens on this account."
          : "Enrollment received. The author will issue your unique code after confirming payment.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send enrollment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg px-5 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg lg:max-w-3xl">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" />
          Back to the academy
        </Link>
        <div className="mt-8 mb-6">
          <AcademyMark size={72} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-brass sm:tracking-[0.24em]">New student</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Sign up & pay</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Add your details, pay {price} with Skrill from anywhere in the world, then the author issues
          a unique code. Sharing a link does not unlock the book.
        </p>
        <JoinWhatsApp className="mt-4" />

        {step !== "sent" ? (
          <ol className="mt-6 grid grid-cols-2 gap-2 text-xs uppercase tracking-wider">
            <li className={cn("rounded-md px-3 py-2", step === "identity" ? "bg-raised text-fg" : "text-muted")}>
              1 · Your details
            </li>
            <li className={cn("rounded-md px-3 py-2", step === "pay" ? "bg-raised text-fg" : "text-muted")}>
              2 · Payment
            </li>
          </ol>
        ) : null}

        {step === "sent" ? (
          <div className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-sm text-fg">Enrollment sent.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {user
                ? "Keep your payment reference. When the author confirms, this class opens on your signed-in account. They may still send the unique code privately as a backup."
                : "Keep your payment reference. When the author confirms, they will send you a unique access code privately. That code works only for you."}
            </p>
            <Button className="mt-6 w-full" asChild>
              <Link to={user ? "/home" : "/"}>{user ? "Back to campus" : "Return"}</Link>
            </Button>
          </div>
        ) : null}

        {step === "identity" ? (
          <form
            className="mt-8 space-y-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            onSubmit={(e) => {
              e.preventDefault();
              goPay();
            }}
          >
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted">Full name</label>
              <Input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As it appears on your payment"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted">Phone number</label>
              <Input
                required
                minLength={8}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp or mobile"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted">X handle</label>
              <Input
                required
                minLength={1}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-muted">Batch</label>
              <select
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value as (typeof STUDENT_BATCHES)[number])}
                className="flex h-12 w-full rounded-md bg-raised px-4 text-base text-fg shadow-[var(--shadow-border)] outline-none focus-visible:shadow-[0_0_0_2px_var(--color-brass)]"
              >
                {STUDENT_BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Continue to payment
              <ArrowRight className="size-4" />
            </Button>
          </form>
        ) : null}

        {step === "pay" ? (
          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => setStep("identity")}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg"
            >
              <ArrowLeft className="size-4" />
              {name} · {batch}
            </button>

            {visibleCats.length > 1 ? (
              <div
                className={cn(
                  "grid gap-2",
                  visibleCats.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3",
                )}
              >
                {visibleCats.map((cat) => {
                  const Icon = cat.id === "skrill" ? CreditCard : cat.id === "nft" ? Sparkles : Wallet;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        const first = rails.find((r) => r.category === cat.id);
                        if (first) setMethodId(first.id);
                      }}
                      className={cn(
                        "flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center shadow-[var(--shadow-border)]",
                        category === cat.id ? "bg-raised text-fg" : "bg-surface text-muted",
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="text-sm font-medium text-fg">{cat.label}</span>
                      <span className="text-[11px] text-faint">{cat.hint}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {inCategory.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl p-5 shadow-[var(--shadow-border)]",
                  methodId === m.id ? "bg-raised" : "bg-surface",
                )}
              >
                <button type="button" className="w-full text-left" onClick={() => setMethodId(m.id)}>
                  <p className="text-sm font-medium">{m.label}</p>
                  {m.network ? (
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-brass">{m.network}</p>
                  ) : null}
                </button>

                {m.category === "skrill" ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm leading-relaxed text-muted">
                      Pay {price} by card worldwide through Skrill. The academy Skrill account is{" "}
                      <span className="font-mono text-fg">{SKRILL_EMAIL}</span>.
                    </p>
                    <form
                      action={SKRILL_CHECKOUT}
                      method="POST"
                      target="_blank"
                      className="space-y-2"
                      onSubmit={() => {
                        writeDraft({
                          name: name.trim(),
                          phone: phone.trim(),
                          handle: handle.trim(),
                          batch,
                          txId,
                        });
                      }}
                    >
                      <input type="hidden" name="pay_to_email" value={SKRILL_EMAIL} />
                      <input type="hidden" name="status_url" value={statusUrl} />
                      <input type="hidden" name="recipient_description" value="AI Ecosystem Academy" />
                      <input type="hidden" name="transaction_id" value={txId} />
                      <input type="hidden" name="return_url" value={returnUrl} />
                      <input type="hidden" name="cancel_url" value={cancelUrl} />
                      <input type="hidden" name="language" value="EN" />
                      <input type="hidden" name="amount" value={amount} />
                      <input type="hidden" name="currency" value="USD" />
                      <input type="hidden" name="firstname" value={person.firstname} />
                      <input type="hidden" name="lastname" value={person.lastname} />
                      {payFromEmail ? <input type="hidden" name="pay_from_email" value={payFromEmail} /> : null}
                      <input type="hidden" name="detail1_description" value="Academy" />
                      <input type="hidden" name="detail1_text" value="Prompt Engineering 101" />
                      <Button type="submit" className="w-full" size="lg">
                        <CreditCard className="size-4" />
                        Pay with card · Skrill
                      </Button>
                    </form>
                    <p className="text-xs text-faint">
                      Opens Skrill's official checkout. You can also{" "}
                      <a href={SKRILL_ACCOUNT} target="_blank" rel="noreferrer" className="text-brass underline-offset-4 hover:underline">
                        sign in to Skrill
                      </a>{" "}
                      and{" "}
                      <a href={SKRILL_SEND_MONEY} target="_blank" rel="noreferrer" className="text-brass underline-offset-4 hover:underline">
                        send money
                      </a>{" "}
                      to {SKRILL_EMAIL}.
                    </p>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-fg"
                      onClick={() => void copyText(SKRILL_EMAIL, "Skrill email copied.")}
                    >
                      <Copy className="size-3.5" />
                      Copy Skrill email
                    </button>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
                      {m.instructions.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : m.category === "crypto" && (m.qrValue || m.address) ? (
                  <div className="mt-4">
                    <div className="mx-auto w-52 max-w-full">
                      <QrCode value={m.qrValue || m.address} label="Wallet QR" />
                    </div>
                    <p className="mt-4 break-all font-mono text-sm leading-6 text-fg">{m.qrValue || m.address}</p>
                    <button
                      type="button"
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-fg"
                      onClick={() => void copyText(m.qrValue || m.address, "Wallet address copied.")}
                    >
                      <Copy className="size-3.5" />
                      Copy wallet address
                    </button>
                    <ul className="mt-4 space-y-1.5 text-xs leading-relaxed text-muted">
                      {m.instructions.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="whitespace-pre-wrap font-mono text-sm leading-6 text-fg/85">{m.details}</p>
                    <button
                      type="button"
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-fg"
                      onClick={() => void copyText(m.details, "Payment details copied.")}
                    >
                      <Copy className="size-3.5" />
                      Copy details
                    </button>
                    {m.instructions.length ? (
                      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted">
                        {m.instructions.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </div>
            ))}

            <form
              className="space-y-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
              onSubmit={(e) => void submit(e)}
            >
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
                  Payment reference or Skrill transaction id
                </label>
                <Input
                  required
                  minLength={4}
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="Skrill transaction id or tx hash"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted">Optional note</label>
                <Textarea
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the author should match"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                <Banknote className="size-4" />
                {busy ? "Sending…" : "Submit enrollment"}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
