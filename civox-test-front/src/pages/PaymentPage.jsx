import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StripeElementsPaymentForm from "../components/payments/StripeElementsPaymentForm";
import { getPaymentSummary } from "../services/organizationRequestService";
import { subscribeToPublicOrganizationRequestEvents } from "../services/organizationRequestRealtimeService";
import { createPublicStripePaymentIntent, syncPublicStripePaymentIntent } from "../services/stripeService";
import { formatMoney, formatStatus } from "../utils/saasFormat";
import "../styles/paymentPage.css";

function PaymentPage() {
  const { token } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const paymentIntentKeyRef = useRef("");
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [realtimeMode, setRealtimeMode] = useState("idle");
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const [paymentEvent, setPaymentEvent] = useState(null);

  useEffect(() => {
    let active = true;

    getPaymentSummary(token)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((summaryError) => {
        if (active) setError(summaryError.message || "Payment link could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    const stream = subscribeToPublicOrganizationRequestEvents(
      token,
      (event) => {
        if (cancelled || !event?.organizationRequestId) {
          return;
        }

        setPaymentEvent(event);
        setSummary((current) => mergePaymentSummary(current, event));
        setLoading(false);
        setPreparingPayment(false);
        setRealtimeMode("live");
        setRealtimeMessage(
          `${event.organizationName || "The request"} was updated instantly after Stripe confirmed payment.`
        );
        getPaymentSummary(token)
          .then((data) => {
            setSummary(data);
          })
          .catch(() => {
            // The live event already updated the state, so this refetch is best-effort.
          });
      },
      (streamError) => {
        if (cancelled) {
          return;
        }

        setRealtimeMode("fallback");
        setRealtimeMessage(
          streamError?.message
            ? `Realtime stream unavailable. Falling back to polling. ${streamError.message}`
            : "Realtime stream unavailable. Falling back to polling."
        );
      }
    );

    return () => {
      cancelled = true;
      stream?.close?.();
    };
  }, [loading, token]);

  useEffect(() => {
    if (realtimeMode !== "fallback" || !token) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      getPaymentSummary(token)
        .then((data) => {
          setSummary(data);
        })
        .catch(() => {
          // Polling is best-effort and the current UI message stays visible.
        });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [realtimeMode, token]);

  useEffect(() => {
    if (!token || !summary || isPaymentComplete(summary)) {
      return undefined;
    }

    const nextPaymentIntentKey = `${token}:${summary.quoteTotal || "0"}`;
    if (paymentIntentKeyRef.current === nextPaymentIntentKey) {
      return undefined;
    }

    let active = true;
    paymentIntentKeyRef.current = nextPaymentIntentKey;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setPreparingPayment(true);
        setPaymentIntent(null);
        setPaymentSuccessMessage("");
        return createPublicStripePaymentIntent({
        flowType: "ORGANIZATION_REQUEST",
        paymentToken: token,
        customerEmail: summary?.contactEmail || summary?.adminEmail || "",
        customerName: summary?.contactPersonName || summary?.organizationName || "",
        });
      })
      .then((intent) => {
        if (active && intent) {
          setPaymentIntent(intent);
          setError("");
        }
      })
      .catch((paymentError) => {
        if (active) {
          setError(paymentError.message || "Secure payment form could not be prepared.");
        }
      })
      .finally(() => {
        if (active) {
          setPreparingPayment(false);
        }
      });

    return () => {
      active = false;
    };
  }, [summary, token]);

  const retryPaymentIntent = () => {
    paymentIntentKeyRef.current = "";
    setPaymentIntent(null);
    setError("");
  };

  const handlePaymentVerified = (verifiedPayment) => {
    setPaymentIntent(verifiedPayment);
    setPaymentSuccessMessage("Payment confirmed securely inside Civox. We are activating the organization now.");
    setError("");
    setSummary((current) => mergePaymentSummary(current, {
      organizationName: verifiedPayment.organizationName,
      desiredSlug: verifiedPayment.organizationSlug,
      paymentStatus: "PAID",
      status: "APPROVED",
      paidAt: verifiedPayment.completedAt,
      activatedAt: verifiedPayment.completedAt,
      stripeSessionId: verifiedPayment.stripePaymentIntentId,
      organizationRequestId: verifiedPayment.organizationRequestId,
    }));

    getPaymentSummary(token)
      .then((data) => {
        setSummary(data);
      })
      .catch(() => {
        // The verified PaymentIntent already updated the UI, so this refetch is best-effort.
      });
  };

  if (loading) {
    return (
      <div className="payment-page">
        <section className="payment-card payment-card--loading">
          <span />
          <p>Loading secure payment details...</p>
        </section>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="payment-page">
        <section className="payment-card">
          <p className="payment-eyebrow">Payment link</p>
          <h1>This link is unavailable</h1>
          <p>{error}</p>
          <Link to="/" className="payment-link-button">
            Back to Civox
          </Link>
        </section>
      </div>
    );
  }

  const alreadyPaid = isPaymentComplete(summary);
  const paymentReference = paymentEvent?.stripeSessionId || paymentIntent?.stripePaymentIntentId || summary?.stripeSessionId;
  const successHref = paymentReference
    ? `/stripe/success?session_id=${encodeURIComponent(paymentReference)}&paymentToken=${encodeURIComponent(token)}`
    : `/payment/${token}/success`;

  return (
    <div className="payment-page">
      <section className="payment-card">
        <div className="payment-card__header">
          <div>
            <p className="payment-eyebrow">Secure Civox checkout</p>
            <h1>{summary.organizationName}</h1>
            <p>Review the approved quote and complete payment.</p>
          </div>
          <span className="payment-status">{formatStatus(summary.paymentStatus)}</span>
        </div>

        {error && <div className="payment-error">{error}</div>}
        {realtimeMessage && realtimeMode === "fallback" && (
          <div className="payment-info">{realtimeMessage}</div>
        )}
        {realtimeMessage && realtimeMode === "live" && alreadyPaid && (
          <div className="payment-success-banner">{realtimeMessage}</div>
        )}

        <div className="payment-summary-grid">
          <div className="payment-summary-item">
            <span>Preferred slug</span>
            <strong>{summary.desiredSlug}</strong>
          </div>
          <div className="payment-summary-item">
            <span>Admin account</span>
            <strong>{summary.adminEmail}</strong>
          </div>
          <div className="payment-summary-item">
            <span>Expected users</span>
            <strong>{summary.expectedNumberOfUsers}</strong>
          </div>
          <div className="payment-summary-item">
            <span>Modules</span>
            <strong>
              {summary.requestedModuleCodes?.length
                ? summary.requestedModuleCodes.join(", ")
                : "Default module set"}
            </strong>
          </div>
        </div>

        <div className="payment-breakdown">
          <Line label="Base platform fee" value={formatMoney(summary.quoteBaseFee)} />
          <Line label="User fee" value={formatMoney(summary.quoteUserFee)} />
          <Line label="Module fee" value={formatMoney(summary.quoteModuleFee)} />
          <Line label="Setup fee" value={formatMoney(summary.quoteSetupFee)} />
          <Line label="Total due" value={formatMoney(summary.quoteTotal)} strong />
        </div>

        <section className="payment-embedded-panel" aria-label="Embedded secure payment form">
          <div className="payment-embedded-panel__header">
            <div>
              <p className="payment-eyebrow">Embedded payment</p>
              <h2>Pay without leaving Civox</h2>
              <p>Stripe securely handles the card details while this page keeps the checkout experience native.</p>
            </div>
            <span className="payment-secure-badge">TLS secure</span>
          </div>

          <div className="payment-order-summary">
            <div>
              <span>Selected plan</span>
              <strong>Civox organization activation</strong>
            </div>
            <div>
              <span>Organization</span>
              <strong>{summary.organizationName}</strong>
            </div>
            <div>
              <span>Price</span>
              <strong>{formatMoney(summary.quoteTotal)}</strong>
            </div>
          </div>

          {paymentSuccessMessage && <div className="payment-success-banner">{paymentSuccessMessage}</div>}

          {!alreadyPaid && preparingPayment && !paymentIntent && (
            <div className="payment-inline-loading">
              <span aria-hidden="true" />
              Preparing Stripe Elements...
            </div>
          )}

          {!alreadyPaid && !preparingPayment && paymentIntent && (
            <StripeElementsPaymentForm
              paymentIntent={paymentIntent}
              syncPaymentIntent={syncPublicStripePaymentIntent}
              returnUrl={`${window.location.origin}/stripe/success?session_id=${encodeURIComponent(paymentIntent.stripePaymentIntentId)}&paymentToken=${encodeURIComponent(token)}`}
              buttonLabel={`Pay ${formatMoney(summary.quoteTotal)}`}
              successMessage="Payment confirmed. Your Civox activation is being finalized."
              onSuccess={handlePaymentVerified}
              onError={(message) => setError(message)}
            />
          )}

          {!alreadyPaid && !preparingPayment && !paymentIntent && (
            <button type="button" className="payment-retry-button" onClick={retryPaymentIntent}>
              Retry secure payment form
            </button>
          )}
        </section>

        {summary.quoteAssumptions && <p className="payment-assumptions">{summary.quoteAssumptions}</p>}

        <div className="payment-actions">
          {alreadyPaid ? (
            <Link to={successHref} className="payment-primary-button">
              View payment result
            </Link>
          ) : null}
          <Link to="/" className="payment-link-button">
            Back to Civox
          </Link>
        </div>

        <p className="payment-assumptions">
          Demo mode only. Use the Stripe test card <strong>4242 4242 4242 4242</strong> with any future expiry date and any CVC.
        </p>
      </section>
    </div>
  );
}

function Line({ label, value, strong = false }) {
  return (
    <div className={strong ? "payment-breakdown__line payment-breakdown__line--total" : "payment-breakdown__line"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isPaymentComplete(summary) {
  return summary?.paymentStatus === "PAID" || summary?.requestStatus === "APPROVED";
}

function mergePaymentSummary(summary, event) {
  if (!summary) {
    return {
      organizationName: event.organizationName,
      desiredSlug: event.desiredSlug,
      contactEmail: event.contactEmail,
      adminEmail: event.adminEmail,
      paymentStatus: event.paymentStatus,
      requestStatus: event.status,
      paidAt: event.paidAt,
      activatedAt: event.activatedAt,
      stripeSessionId: event.stripeSessionId,
      organizationCreatedId: event.organizationCreatedId,
    };
  }

  return {
    ...summary,
    paymentStatus: event.paymentStatus || summary.paymentStatus,
    requestStatus: event.status || summary.requestStatus,
    paidAt: event.paidAt || summary.paidAt,
    activatedAt: event.activatedAt || summary.activatedAt,
    stripeSessionId: event.stripeSessionId || summary.stripeSessionId,
    organizationCreatedId:
      event.organizationCreatedId !== undefined ? event.organizationCreatedId : summary.organizationCreatedId,
  };
}

export default PaymentPage;
