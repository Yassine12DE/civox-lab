import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completePayment, getPaymentSummary } from "../services/organizationRequestService";
import { formatMoney, formatStatus } from "../utils/saasFormat";
import "../styles/paymentPage.css";

function PaymentPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

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

  const handlePayment = async () => {
    setPaying(true);
    setError("");

    try {
      const paidSummary = await completePayment(token);
      navigate(`/payment/${token}/success`, {
        replace: true,
        state: { summary: paidSummary },
      });
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
            <Link to={`/payment/${token}/success`} state={{ summary }} className="payment-primary-button">
              Continue
            </Link>
          ) : (
            <button type="button" onClick={handlePayment} disabled={paying}>
              {paying ? "Processing payment..." : `Pay ${formatMoney(summary.quoteTotal)}`}
            </button>
          )}
          <Link to="/" className="payment-link-button">
            Back to Civox
          </Link>
        </div>
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

export default PaymentPage;
