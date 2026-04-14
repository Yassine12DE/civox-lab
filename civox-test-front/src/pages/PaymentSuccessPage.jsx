import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { completePayment } from "../services/organizationRequestService";
import { formatMoney } from "../utils/saasFormat";
import "../styles/paymentPage.css";

function PaymentSuccessPage() {
  const { token } = useParams();
  const location = useLocation();
  const [summary, setSummary] = useState(location.state?.summary || null);
  const [loading, setLoading] = useState(!isPaymentComplete(location.state?.summary));
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPaymentComplete(summary)) {
      return;
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
  }, [summary, token]);

  if (loading) {
    return (
      <div className="payment-page">
        <section className="payment-card payment-card--loading">
          <span />
          <p>Completing payment and activating your Civox workspace...</p>
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

function isPaymentComplete(summary) {
  return summary?.paymentStatus === "PAID" || summary?.requestStatus === "APPROVED";
}

export default PaymentSuccessPage;
