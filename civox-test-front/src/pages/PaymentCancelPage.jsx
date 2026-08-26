import { Link, useParams, useSearchParams } from "react-router-dom";
import { formatStatus } from "../utils/saasFormat";
import "../styles/paymentPage.css";

function PaymentCancelPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const paymentToken = token || searchParams.get("paymentToken") || "";
  const flow = searchParams.get("flow") || "STRIPE_PAYMENT";
  const organizationName = searchParams.get("organizationName") || "your Civox workspace";
  const organizationSlug = searchParams.get("organizationSlug") || "";
  const planCode = searchParams.get("planCode") || "";

  return (
    <div className="payment-page">
      <section className="payment-card payment-success-card">
        <p className="payment-eyebrow">Payment cancelled</p>
        <h1>{organizationName}</h1>
        <p>
          The secure Stripe payment flow was closed before payment was completed.
          {flow === "ORGANIZATION_REQUEST"
            ? " Your organization request remains saved and can be retried whenever you are ready."
            : " Your subscription simulation remains in draft state until you launch a new payment."}
        </p>

        <div className="payment-summary-grid">
          <div className="payment-summary-item">
            <span>Flow</span>
            <strong>{formatStatus(flow)}</strong>
          </div>
          <div className="payment-summary-item">
            <span>Organization</span>
            <strong>{organizationName}</strong>
          </div>
          <div className="payment-summary-item">
            <span>Slug</span>
            <strong>{organizationSlug || "Not available"}</strong>
          </div>
          <div className="payment-summary-item">
            <span>Plan</span>
            <strong>{planCode || "Embedded payment"}</strong>
          </div>
        </div>

        <div className="payment-actions">
          {paymentToken ? (
            <Link to={`/payment/${paymentToken}`} className="payment-primary-button">
              Retry embedded payment
            </Link>
          ) : flow === "SUBSCRIPTION" ? (
            <Link to="/saas/plans" className="payment-primary-button">
              Review subscriptions
            </Link>
          ) : (
            <Link to="/" className="payment-primary-button">
              Back to Civox
            </Link>
          )}
          {(paymentToken || flow === "SUBSCRIPTION") && (
            <Link to="/" className="payment-link-button">
              Back to Civox
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default PaymentCancelPage;
