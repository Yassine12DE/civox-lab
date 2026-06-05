import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPaymentSummary } from "../services/organizationRequestService";
import { subscribeToPublicOrganizationRequestEvents } from "../services/organizationRequestRealtimeService";
import { createPublicStripeCheckoutSession } from "../services/stripeService";
import { formatMoney, formatStatus } from "../utils/saasFormat";
import "../styles/paymentPage.css";

function PaymentPage() {
  const { token } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
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
    setRealtimeMode("live");
    setRealtimeMessage("");

    const stream = subscribeToPublicOrganizationRequestEvents(
      token,
      (event) => {
        if (cancelled || !event?.organizationRequestId) {
          return;
        }

        setPaymentEvent(event);
        setSummary((current) => mergePaymentSummary(current, event));
        setLoading(false);
        setPaying(false);
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

  const handlePayment = async () => {
    setPaying(true);
    setError("");

    try {
      // Stripe test card for demo checkout: 4242 4242 4242 4242, any future expiry, any CVC.
      const session = await createPublicStripeCheckoutSession({
        flowType: "ORGANIZATION_REQUEST",
        paymentToken: token,
        customerEmail: summary?.contactEmail || summary?.adminEmail || "",
        customerName: summary?.contactPersonName || summary?.organizationName || "",
      });

      if (!session?.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned by the backend.");
      }

      window.location.assign(session.checkoutUrl);
    } catch (paymentError) {
      setError(paymentError.message || "Payment could not be completed.");
      setPaying(false);
    }
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

  const alreadyPaid = summary?.paymentStatus === "PAID" || summary?.requestStatus === "APPROVED";
  const successHref = paymentEvent?.stripeSessionId
    ? `/stripe/success?session_id=${encodeURIComponent(paymentEvent.stripeSessionId)}`
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

        {summary.quoteAssumptions && <p className="payment-assumptions">{summary.quoteAssumptions}</p>}

        <div className="payment-actions">
          {alreadyPaid ? (
            <Link to={successHref} className="payment-primary-button">
              View payment result
            </Link>
          ) : (
            <button type="button" onClick={handlePayment} disabled={paying}>
              {paying ? "Opening Stripe Checkout..." : `Pay with Stripe ${formatMoney(summary.quoteTotal)}`}
            </button>
          )}
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
