import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { completePayment, getPaymentSummary } from "../services/organizationRequestService";
import { subscribeToPublicOrganizationRequestEvents } from "../services/organizationRequestRealtimeService";
import { getStripeCheckoutSession, syncPublicStripePaymentIntent } from "../services/stripeService";
import { formatDateTime, formatMoney, formatStatus } from "../utils/saasFormat";
import "../styles/paymentPage.css";

function PaymentSuccessPage() {
  const { token } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || searchParams.get("payment_intent") || "";
  const paymentToken = searchParams.get("paymentToken") || searchParams.get("payment_token") || "";
  const hasLegacyToken = Boolean(token);
  const initialPaymentComplete = isPaymentComplete(location.state?.summary);
  const [stripeSession, setStripeSession] = useState(location.state?.stripeSession || null);
  const [summary, setSummary] = useState(location.state?.summary || null);
  const [loading, setLoading] = useState(Boolean(sessionId) || (hasLegacyToken && !initialPaymentComplete));
  const [error, setError] = useState("");
  const [realtimeMode, setRealtimeMode] = useState("idle");
  const [realtimeMessage, setRealtimeMessage] = useState("");

  useEffect(() => {
    if (sessionId) {
      let active = true;

      loadStripePaymentRecord(sessionId)
        .then((data) => {
          if (active) {
            setStripeSession(data || null);
            setError("");
            const nextToken = data?.referenceToken || paymentToken;
            if (nextToken) {
              getPaymentSummarySafely(nextToken).then((paymentSummary) => {
                if (active && paymentSummary) {
                  setSummary(paymentSummary);
                }
              });
            }
          }
        })
        .catch((sessionError) => {
          if (active) setError(sessionError.message || "Stripe payment record could not be loaded.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }

    if (initialPaymentComplete) {
      return undefined;
    }

    if (!token) {
      return undefined;
    }

    let active = true;

    completePayment(token)
      .then((data) => {
        if (active) {
          setSummary(data);
          setError("");
        }
      })
      .catch((activationError) => {
        if (active) setError(activationError.message || "Activation could not be completed.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialPaymentComplete, paymentToken, sessionId, token]);

  useEffect(() => {
    const liveToken = paymentToken || stripeSession?.referenceToken || token;
    if (!liveToken) {
      return undefined;
    }

    let cancelled = false;

    const stream = subscribeToPublicOrganizationRequestEvents(
      liveToken,
      (event) => {
        if (cancelled || !event?.organizationRequestId) {
          return;
        }

        setSummary((current) => mergePaymentSummary(current, event));
        setStripeSession((current) => mergeStripeSession(current, event));
        setLoading(false);
        setRealtimeMessage(
          `${event.organizationName || "The request"} was validated instantly after Stripe confirmed payment.`
        );
        const liveToken = paymentToken || stripeSession?.referenceToken || token || event.paymentToken;
        if (liveToken) {
          getPaymentSummarySafely(liveToken).then((paymentSummary) => {
            if (paymentSummary) {
              setSummary(paymentSummary);
            }
          });
        }
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
  }, [loading, paymentToken, sessionId, stripeSession?.referenceToken, token]);

  useEffect(() => {
    if (realtimeMode !== "fallback") {
      return undefined;
    }

    const liveToken = paymentToken || stripeSession?.referenceToken || token;
    const interval = window.setInterval(() => {
      const summaryPromise = liveToken ? getPaymentSummarySafely(liveToken) : Promise.resolve(null);
      const sessionPromise = sessionId ? loadStripePaymentRecord(sessionId).catch(() => null) : Promise.resolve(null);

      Promise.all([summaryPromise, sessionPromise]).then(([paymentSummary, nextStripeSession]) => {
        if (paymentSummary) {
          setSummary(paymentSummary);
        }
        if (nextStripeSession) {
          setStripeSession(nextStripeSession);
        }
      });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [paymentToken, realtimeMode, sessionId, stripeSession?.referenceToken, token]);

  if (loading) {
    return (
      <div className="payment-page">
        <section className="payment-card payment-card--loading">
          <span />
          <p>Verifying the Stripe payment and finalizing your Civox workspace...</p>
        </section>
      </div>
    );
  }

  if (!sessionId && !hasLegacyToken && !isPaymentComplete(summary)) {
    return (
      <div className="payment-page">
        <section className="payment-card payment-success-card">
          <p className="payment-eyebrow">Stripe payment</p>
          <h1>Missing session information</h1>
          <p>The Stripe success page needs a payment reference or an organization payment token.</p>
          <div className="payment-actions">
            <Link to="/" className="payment-primary-button">
              Back to Civox
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (sessionId) {
    if (error && !stripeSession && !isPaymentComplete(summary)) {
      return (
        <div className="payment-page">
          <section className="payment-card payment-success-card">
            <p className="payment-eyebrow">Stripe payment</p>
            <h1>We could not confirm the session yet</h1>
            <p>{error}</p>
            <div className="payment-actions">
              <Link to="/" className="payment-primary-button">
                Back to Civox
              </Link>
              <Link to="/stripe/cancel" className="payment-link-button">
                Open cancel page
              </Link>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="payment-page">
        <section className="payment-card payment-success-card">
          <p className="payment-eyebrow">Stripe payment complete</p>
          <h1>{summary?.organizationName || stripeSession?.organizationName || "Your Civox payment is complete"}</h1>
          <p>
            {isPaymentComplete(summary) || stripeSession?.paymentStatus === "COMPLETED"
              ? "Stripe confirmed the payment and the Civox request was updated instantly."
              : "Stripe returned successfully and the backend is finishing the validation step."}
          </p>

          {realtimeMessage && (
            <div className={realtimeMode === "fallback" ? "payment-info" : "payment-success-banner"}>
              {realtimeMessage}
            </div>
          )}

          <div className="payment-summary-grid">
            <Detail label="Flow" value={formatStatus(stripeSession?.flowType || "PAYMENT")} />
            <Detail label="Organization" value={summary?.organizationName || stripeSession?.organizationName || "Not available"} />
            <Detail label="Slug" value={summary?.desiredSlug || stripeSession?.organizationSlug || "Not available"} />
            <Detail
              label="Amount"
              value={
                summary?.quoteTotal !== undefined && summary?.quoteTotal !== null
                  ? formatMoney(summary.quoteTotal)
                  : stripeSession?.amount !== undefined
                    ? formatMoney(stripeSession.amount)
                    : "Not available"
              }
            />
            <Detail label="Payment status" value={formatStatus(summary?.paymentStatus || stripeSession?.paymentStatus || "OPEN")} />
            <Detail label="Created" value={formatDateTime(stripeSession?.createdAt || summary?.createdAt)} />
          </div>

          <div className="payment-breakdown">
            <Line label="Payment reference" value={stripeSession?.stripeSessionId || stripeSession?.stripePaymentIntentId || sessionId} />
            <Line label="Plan / modules" value={stripeSession?.planCode || stripeSession?.moduleSummary || "Embedded payment"} />
            <Line label="Customer email" value={stripeSession?.customerEmail || summary?.contactEmail || "Not available"} />
            {stripeSession?.stripePaymentIntentId && (
              <Line label="Payment intent" value={stripeSession.stripePaymentIntentId} />
            )}
            {summary?.stripeSessionId && <Line label="Backend Stripe session" value={summary.stripeSessionId} />}
          </div>

          <div className="payment-actions">
            {stripeSession?.referenceToken && stripeSession.flowType === "ORGANIZATION_REQUEST" && (
              <Link to={`/payment/${stripeSession.referenceToken}`} className="payment-primary-button">
                Review payment page
              </Link>
            )}
            <Link to="/" className="payment-link-button">
              Back to Civox
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (error && !isPaymentComplete(summary)) {
    return (
      <div className="payment-page">
        <section className="payment-card payment-success-card">
          <p className="payment-eyebrow">Activation pending</p>
          <h1>Payment could not be completed</h1>
          <p>{error}</p>
          <div className="payment-actions">
            <Link to={`/payment/${token}`} className="payment-primary-button">
              Return to payment
            </Link>
            <Link to="/" className="payment-link-button">
              Back to Civox
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <section className="payment-card payment-success-card">
        <p className="payment-eyebrow">Activation complete</p>
        <h1>{summary?.organizationName || "Your organization is active"}</h1>
        {realtimeMessage && (
          <div className={realtimeMode === "fallback" ? "payment-info" : "payment-success-banner"}>
            {realtimeMessage}
          </div>
        )}
        <p>
          Payment is complete and the organization workspace has been created.
          {summary?.emailDeliveryWarning
            ? ` The welcome email could not be sent to ${summary?.adminEmail || "the initial admin"} yet.`
            : ` The welcome email has been sent to ${summary?.adminEmail || "the initial admin"}.`}
        </p>

        {summary && (
          <div className="payment-success-total">
            <span>Paid amount</span>
            <strong>{formatMoney(summary.quoteTotal)}</strong>
          </div>
        )}

        {summary?.emailDeliveryWarning && <div className="payment-error">{summary.emailDeliveryWarning}</div>}
        {error && <div className="payment-error">{error}</div>}

        <div className="payment-actions">
          {summary?.organizationAccessUrl && (
            <a href={summary.organizationAccessUrl} className="payment-primary-button">
              Access your Civox platform
            </a>
          )}
          <Link to="/" className="payment-link-button">
            Back to Civox
          </Link>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="payment-summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="payment-breakdown__line">
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
    organizationName: event.organizationName || summary.organizationName,
    desiredSlug: event.desiredSlug || summary.desiredSlug,
  };
}

function mergeStripeSession(stripeSession, event) {
  if (!stripeSession) {
    return {
      stripeSessionId: event.stripeSessionId,
      organizationName: event.organizationName,
      organizationSlug: event.desiredSlug,
      paymentStatus: event.paymentStatus === "PAID" ? "COMPLETED" : "OPEN",
    };
  }

  return {
    ...stripeSession,
    paymentStatus: event.paymentStatus === "PAID" ? "COMPLETED" : stripeSession.paymentStatus,
    stripeSessionId: event.stripeSessionId || stripeSession.stripeSessionId,
    organizationName: event.organizationName || stripeSession.organizationName,
    organizationSlug: event.desiredSlug || stripeSession.organizationSlug,
  };
}

async function getPaymentSummarySafely(token) {
  try {
    return await getPaymentSummary(token);
  } catch {
    return null;
  }
}

async function loadStripePaymentRecord(referenceId) {
  const data = String(referenceId || "").startsWith("pi_")
    ? await syncPublicStripePaymentIntent(referenceId)
    : await getStripeCheckoutSession(referenceId);

  return {
    ...data,
    stripeSessionId: data?.stripeSessionId || data?.stripePaymentIntentId || referenceId,
  };
}

export default PaymentSuccessPage;
