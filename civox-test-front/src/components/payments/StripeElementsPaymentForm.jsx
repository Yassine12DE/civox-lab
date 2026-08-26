import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "../../styles/embeddedPayment.css";

const stripePromiseCache = new Map();

function getStripePromise(publishableKey) {
  if (!publishableKey) return null;
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey);
}

function StripeElementsPaymentForm({
  paymentIntent,
  syncPaymentIntent,
  returnUrl,
  buttonLabel = "Pay now",
  successMessage = "Payment confirmed. Your workspace is being updated.",
  className = "",
  submitClassName = "",
  disabled = false,
  onSuccess,
  onError,
}) {
  const stripePromise = getStripePromise(paymentIntent?.publishableKey);

  if (!paymentIntent?.clientSecret || !stripePromise) {
    return (
      <div className={`embedded-payment-form embedded-payment-form--loading ${className}`.trim()}>
        <span className="embedded-payment-form__spinner" aria-hidden="true" />
        <p>Preparing secure payment form...</p>
      </div>
    );
  }

  const elementsOptions = {
    clientSecret: paymentIntent.clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#7B2CBF",
        colorBackground: "#ffffff",
        colorText: "#171321",
        colorDanger: "#b42318",
        colorTextSecondary: "#655f70",
        borderRadius: "12px",
        fontFamily: "inherit",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          border: "1px solid #e6e0ee",
          boxShadow: "none",
          padding: "12px",
        },
        ".Input:focus": {
          borderColor: "#7B2CBF",
          boxShadow: "0 0 0 3px rgba(123, 44, 191, 0.14)",
        },
        ".Label": {
          color: "#171321",
          fontWeight: "700",
        },
      },
    },
  };

  return (
    <Elements key={paymentIntent.clientSecret} stripe={stripePromise} options={elementsOptions}>
      <StripeElementsPaymentFormInner
        paymentIntent={paymentIntent}
        syncPaymentIntent={syncPaymentIntent}
        returnUrl={returnUrl}
        buttonLabel={buttonLabel}
        successMessage={successMessage}
        className={className}
        submitClassName={submitClassName}
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

function StripeElementsPaymentFormInner({
  paymentIntent,
  syncPaymentIntent,
  returnUrl,
  buttonLabel,
  successMessage,
  className,
  submitClassName,
  disabled,
  onSuccess,
  onError,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || submitting || disabled || succeeded) return;

    setSubmitting(true);
    setMessage("");

    try {
      // Stripe Elements confirms card/payment details without exposing them to Civox.
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment could not be confirmed.");
      }

      const paymentIntentId = result.paymentIntent?.id || paymentIntent.stripePaymentIntentId;
      const verifiedPayment = await syncPaymentIntent(paymentIntentId);

      if (verifiedPayment?.paymentStatus !== "COMPLETED") {
        throw new Error("Stripe has not marked this payment as completed yet. Please try again in a moment.");
      }

      setSucceeded(true);
      setMessage(successMessage);
      onSuccess?.(verifiedPayment);
    } catch (error) {
      const nextMessage = error.message || "Payment failed. Please check the card details and try again.";
      setMessage(nextMessage);
      onError?.(nextMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || !stripe || !elements || !ready;

  return (
    <form className={`embedded-payment-form ${className}`.trim()} onSubmit={handleSubmit}>
      <div className="embedded-payment-form__element">
        <PaymentElement
          onReady={() => setReady(true)}
          onChange={(event) => {
            if (event.error?.message) {
              setMessage(event.error.message);
            } else if (!succeeded) {
              setMessage("");
            }
          }}
        />
      </div>

      {message && (
        <p
          className={
            succeeded
              ? "embedded-payment-form__message embedded-payment-form__message--success"
              : "embedded-payment-form__message embedded-payment-form__message--error"
          }
          role="status"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        className={`embedded-payment-form__button ${submitClassName}`.trim()}
        disabled={busy || disabled || succeeded}
        aria-busy={busy || undefined}
      >
        {submitting ? "Verifying payment..." : ready ? buttonLabel : "Loading secure form..."}
      </button>

      <p className="embedded-payment-form__secure-note">
        Secured by Stripe. Use test card 4242 4242 4242 4242 with any future expiry and any CVC.
      </p>
    </form>
  );
}

export default StripeElementsPaymentForm;
