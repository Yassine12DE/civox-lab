import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  OrganizationPageHeader,
  OrganizationStatusPill,
} from "../components/organization/OrganizationUi";
import {
  getOrganizationSurvey,
  getOrganizationSurveys,
  getPublicSurvey,
  getPublicSurveys,
  submitSurvey,
} from "../services/surveyService";

function OrganizationSurveyPage() {
  const { surveyId } = useParams();
  const { organization, settings, currentUser } = useOutletContext();
  const [surveys, setSurveys] = useState([]);
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = surveyId
          ? (currentUser
            ? await getOrganizationSurvey(organization.id, surveyId)
            : await getPublicSurvey(surveyId))
          : (currentUser
            ? await getOrganizationSurveys(organization.id)
            : await getPublicSurveys());
        if (!active) return;
        if (surveyId) {
          setSurvey(data);
          setAnswers(Object.fromEntries((data.questions || []).map((question) => [
            question.id,
            question.type === "MULTIPLE_CHOICE" ? (question.myValues || []) : (question.myValues?.[0] || ""),
          ])));
        } else {
          setSurveys(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "Could not load surveys");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [currentUser, organization.id, surveyId]);

  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const payload = (survey.questions || []).map((question) => ({
        questionId: question.id,
        values: Array.isArray(answers[question.id])
          ? answers[question.id]
          : String(answers[question.id] ?? "").trim() ? [String(answers[question.id]).trim()] : [],
      }));
      const updated = await submitSurvey(organization.id, survey.id, payload);
      setSurvey(updated);
      setNotice("Your response has been saved. You can update it while the survey remains open.");
    } catch (saveError) {
      setError(saveError.message || "Could not save your response");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="premium-page"><section className="premium-section"><div className="premium-container">
      <OrganizationLoadingState title="Loading surveys" message="Fetching current consultation opportunities." />
    </div></section></div>;
  }

  if (!surveyId) {
    const publicSurveys = surveys.filter((item) => item.status === "PUBLISHED");
    return (
      <div className="premium-page">
        <section className="premium-section"><div className="premium-container">
          <OrganizationPageHeader
            eyebrow="Surveys"
            title="Share your experience"
            description="Respond to structured consultations published by your organization."
            organization={organization}
            logoUrl={settings.logoUrl}
          />
          {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
          {!error && publicSurveys.length === 0 ? (
            <OrganizationEmptyState title="No surveys are open" message="Published surveys will appear here." actionLabel="All modules" actionTo="/modules" icon="file" />
          ) : (
            <div className="org-survey-grid">
              {publicSurveys.map((item) => (
                <Link key={item.id} to={`/modules/surveys/${item.id}`} className="org-survey-card">
                  <div className="org-survey-card__top">
                    <OrganizationStatusPill tone={lifecycleTone(item.lifecycle)}>{label(item.lifecycle)}</OrganizationStatusPill>
                    {item.featured && <span className="org-survey-featured"><OrgIcon name="sparkles" size={14} /> Featured</span>}
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.description || "Open this survey to review its questions."}</p>
                  <div className="org-survey-card__meta">
                    <span>{item.questions?.length || 0} questions</span>
                    <span>{item.responseCount || 0} responses</span>
                    {item.closingAt && <span>Closes {formatDate(item.closingAt)}</span>}
                  </div>
                  <strong className="org-survey-card__cta">Open survey <OrgIcon name="arrowRight" size={16} /></strong>
                </Link>
              ))}
            </div>
          )}
        </div></section>
      </div>
    );
  }

  if (!survey) {
    return <div className="premium-page"><section className="premium-section"><div className="premium-container">
      <OrganizationEmptyState title="Survey unavailable" message={error || "This survey could not be found."} actionLabel="Back to surveys" actionTo="/modules/surveys" />
    </div></section></div>;
  }

  return (
    <div className="premium-page">
      <section className="premium-section"><div className="premium-container org-survey-detail">
        <Link to="/modules/surveys" className="org-survey-back"><OrgIcon name="arrowLeft" size={16} /> All surveys</Link>
        <OrganizationPageHeader
          eyebrow="Organization survey"
          title={survey.title}
          description={survey.description}
          organization={organization}
          logoUrl={settings.logoUrl}
          meta={<OrganizationStatusPill tone={lifecycleTone(survey.lifecycle)}>{label(survey.lifecycle)}</OrganizationStatusPill>}
        />
        {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
        {notice && <OrganizationNotice tone="success">{notice}</OrganizationNotice>}
        <div className="org-survey-layout">
          <form className="premium-form-card org-survey-form" onSubmit={save}>
            {(survey.questions || []).map((question, index) => (
              <SurveyQuestionField key={question.id} question={question} index={index}
                value={answers[question.id]} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />
            ))}
            {!currentUser && <OrganizationNotice>Sign in as an organization member to submit a response.</OrganizationNotice>}
            {currentUser && !survey.acceptingResponses && <OrganizationNotice tone="warning">This survey is not currently accepting responses.</OrganizationNotice>}
            <button className="org-ui-button org-ui-button--primary" type="submit" disabled={!currentUser || !survey.acceptingResponses || saving}>
              <OrgIcon name="check" size={17} /> {saving ? "Saving..." : survey.submittedByMe ? "Update my response" : "Submit response"}
            </button>
          </form>
          <aside className="org-survey-sidebar">
            <div className="premium-card">
              <h3>Survey details</h3>
              <dl className="org-survey-facts">
                <div><dt>Questions</dt><dd>{survey.questions?.length || 0}</dd></div>
                <div><dt>Responses</dt><dd>{survey.responseCount || 0}</dd></div>
                <div><dt>Closes</dt><dd>{formatDate(survey.closingAt) || "No deadline"}</dd></div>
              </dl>
            </div>
            {survey.resultsVisible && <SurveyResults survey={survey} />}
          </aside>
        </div>
      </div></section>
    </div>
  );
}

function SurveyQuestionField({ question, index, value, onChange }) {
  const legend = <><span>{index + 1}.</span> {question.prompt} {question.required && <em>Required</em>}</>;
  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(value) ? value : [];
    return <fieldset className="org-survey-question"><legend>{legend}</legend>{question.options.map((option) => (
      <label className="org-survey-option" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} /> {option}</label>
    ))}</fieldset>;
  }
  if (["SINGLE_CHOICE", "YES_NO", "RATING"].includes(question.type)) {
    const options = question.type === "YES_NO" ? ["Yes", "No"] : question.type === "RATING" ? ["1", "2", "3", "4", "5"] : question.options;
    return <fieldset className="org-survey-question"><legend>{legend}</legend>{options.map((option) => (
      <label className="org-survey-option" key={option}><input type="radio" name={`question-${question.id}`} value={option} checked={value === option} required={question.required} onChange={(event) => onChange(event.target.value)} /> {option}</label>
    ))}</fieldset>;
  }
  const type = question.type === "NUMBER" ? "number" : question.type === "DATE" ? "date" : "text";
  return <label className="org-survey-question"><span className="org-survey-legend">{legend}</span>{question.type === "LONG_TEXT"
    ? <textarea rows="5" value={value || ""} required={question.required} onChange={(event) => onChange(event.target.value)} />
    : <input type={type} value={value || ""} required={question.required} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function SurveyResults({ survey }) {
  return <div className="premium-card"><h3>Current results</h3>{survey.questions.map((question) => (
    <div className="org-survey-result" key={question.id}><strong>{question.prompt}</strong>
      {Object.entries(question.resultCounts || {}).length === 0 ? <span>Aggregate results are not applicable.</span> : Object.entries(question.resultCounts).map(([value, count]) => (
        <div key={value}><span>{value}</span><b>{count}</b></div>
      ))}
    </div>
  ))}</div>;
}

function lifecycleTone(value) { return value === "OPEN" ? "success" : value === "SCHEDULED" ? "info" : "neutral"; }
function label(value) { return String(value || "").toLowerCase().replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase()); }
function formatDate(value) { return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : ""; }

export default OrganizationSurveyPage;
