import SaasIcon from "./SaasIcon";

function SaasConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="saas-dialog-backdrop" role="presentation">
      <section
        className="saas-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saas-confirm-title"
      >
        <div className={`saas-dialog__icon saas-dialog__icon--${tone}`}>
          <SaasIcon name={tone === "danger" ? "alert" : "check"} size={20} />
        </div>
        <div>
          <h2 id="saas-confirm-title">{title}</h2>
          {message && <p>{message}</p>}
        </div>
        <div className="saas-dialog__actions">
          <button type="button" className="saas-button saas-button--ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`saas-button ${tone === "danger" ? "saas-button--danger" : "saas-button--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default SaasConfirmDialog;
