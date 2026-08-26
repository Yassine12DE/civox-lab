import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { OrgIcon, OrganizationLoadingState, OrganizationNotice, OrganizationPageHeader } from "../components/organization/OrganizationUi";
import { createSurvey, getOrganizationSurvey, updateSurvey } from "../services/surveyService";

const EMPTY_QUESTION = { prompt: "", type: "SINGLE_CHOICE", required: false, options: ["", ""] };
const TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "SHORT_TEXT", "LONG_TEXT", "RATING", "YES_NO", "NUMBER", "DATE"];

function OrganizationSurveyEditorPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { organization, settings } = useOutletContext();
  const [form, setForm] = useState({ title: "", description: "", status: "DRAFT", openingAt: "", closingAt: "", resultVisibility: "AFTER_CLOSE", featured: false, questions: [{ ...EMPTY_QUESTION, options: ["", ""] }] });
  const [loading, setLoading] = useState(Boolean(surveyId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!surveyId) return;
    getOrganizationSurvey(organization.id, surveyId).then((survey) => setForm({
      title: survey.title || "", description: survey.description || "", status: survey.status,
      openingAt: toLocalInput(survey.openingAt), closingAt: toLocalInput(survey.closingAt),
      resultVisibility: survey.resultVisibility, featured: Boolean(survey.featured),
      questions: survey.questions.map((question) => ({ prompt: question.prompt, type: question.type, required: Boolean(question.required), options: question.options?.length ? question.options : ["", ""] })),
    })).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, [organization.id, surveyId]);

  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      const payload = { ...form, openingAt: form.openingAt || null, closingAt: form.closingAt || null,
        questions: form.questions.map((question) => ({ ...question, options: isChoice(question.type) ? question.options : [] })) };
      const saved = surveyId ? await updateSurvey(organization.id, surveyId, payload) : await createSurvey(organization.id, payload);
      navigate(`/backoffice/surveys/${saved.id}/edit`, { replace: true });
    } catch (saveError) { setError(saveError.message || "Could not save survey"); }
    finally { setSaving(false); }
  };

  const updateQuestion = (index, patch) => setForm((current) => ({ ...current, questions: current.questions.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question) }));
  const removeQuestion = (index) => setForm((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) }));

  if (loading) return <OrganizationLoadingState title="Loading survey editor" />;
  return <div className="premium-page"><div className="premium-container">
    <Link to="/backoffice/surveys" className="org-survey-back"><OrgIcon name="arrowLeft" size={16} /> Survey workspace</Link>
    <OrganizationPageHeader variant="admin" eyebrow="Survey editor" title={surveyId ? "Edit survey" : "Create survey"}
      description="Configure the publication window, result policy, and member questions."
      organization={organization} logoUrl={settings.logoUrl} />
    {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
    <form className="org-survey-editor" onSubmit={save}>
      <section className="premium-form-card"><h2>Survey details</h2>
        <div className="premium-field"><label htmlFor="survey-title">Title</label><input id="survey-title" maxLength="180" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
        <div className="premium-field"><label htmlFor="survey-description">Description</label><textarea id="survey-description" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
        <div className="premium-field-grid"><div className="premium-field"><label>Status</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>
          <div className="premium-field"><label>Results visible</label><select value={form.resultVisibility} onChange={(event) => setForm({ ...form, resultVisibility: event.target.value })}><option value="AFTER_SUBMISSION">After member submits</option><option value="AFTER_CLOSE">After survey closes</option><option value="PRIVATE">Operators only</option></select></div>
          <div className="premium-field"><label>Opens</label><input type="datetime-local" value={form.openingAt} onChange={(event) => setForm({ ...form, openingAt: event.target.value })} /></div>
          <div className="premium-field"><label>Closes</label><input type="datetime-local" value={form.closingAt} onChange={(event) => setForm({ ...form, closingAt: event.target.value })} /></div></div>
        <label className="org-survey-option"><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Feature this survey in listings</label>
      </section>
      <section className="premium-form-card"><div className="org-survey-editor__heading"><div><h2>Questions</h2><p>Responses are validated against these settings.</p></div><button type="button" className="premium-soft-button" onClick={() => setForm({ ...form, questions: [...form.questions, { ...EMPTY_QUESTION, options: ["", ""] }] })}><OrgIcon name="plus" size={16} /> Add question</button></div>
        {form.questions.map((question, index) => <div className="org-survey-builder" key={index}>
          <div className="org-survey-builder__number">{index + 1}</div><div className="org-survey-builder__body">
            <div className="premium-field"><label>Question</label><input required value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} /></div>
            <div className="premium-field-grid"><div className="premium-field"><label>Answer type</label><select value={question.type} onChange={(event) => updateQuestion(index, { type: event.target.value })}>{TYPES.map((type) => <option value={type} key={type}>{pretty(type)}</option>)}</select></div>
              <label className="org-survey-option org-survey-builder__required"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, { required: event.target.checked })} /> Required response</label></div>
            {isChoice(question.type) && <div className="org-survey-options-editor"><label>Options</label>{question.options.map((option, optionIndex) => <div key={optionIndex}><input required value={option} onChange={(event) => updateQuestion(index, { options: question.options.map((item, itemIndex) => itemIndex === optionIndex ? event.target.value : item) })} /><button type="button" aria-label="Remove option" onClick={() => updateQuestion(index, { options: question.options.filter((_, itemIndex) => itemIndex !== optionIndex) })}><OrgIcon name="x" size={15} /></button></div>)}
              <button type="button" className="premium-soft-button" onClick={() => updateQuestion(index, { options: [...question.options, ""] })}>Add option</button></div>}
          </div><button type="button" className="org-survey-remove" aria-label="Remove question" onClick={() => removeQuestion(index)}><OrgIcon name="trash" size={17} /></button>
        </div>)}
      </section>
      <div className="org-survey-savebar"><Link to="/backoffice/surveys" className="org-ui-button org-ui-button--secondary">Cancel</Link><button type="submit" disabled={saving} className="org-ui-button org-ui-button--primary"><OrgIcon name="save" size={17} /> {saving ? "Saving..." : "Save survey"}</button></div>
    </form>
  </div></div>;
}

function isChoice(type) { return type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"; }
function pretty(value) { return value.toLowerCase().replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase()); }
function toLocalInput(value) { if (!value) return ""; const date = new Date(value); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
export default OrganizationSurveyEditorPage;
