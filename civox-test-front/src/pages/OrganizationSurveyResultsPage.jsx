import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { OrgIcon, OrganizationLoadingState, OrganizationNotice, OrganizationPageHeader } from "../components/organization/OrganizationUi";
import { downloadSurveyResults, getSurveyResults } from "../services/surveyService";

function OrganizationSurveyResultsPage() {
  const { surveyId } = useParams();
  const { organization, settings } = useOutletContext();
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getSurveyResults(organization.id, surveyId).then(setSurvey)
      .catch((loadError) => setError(loadError.message || "Could not load results"));
  }, [organization.id, surveyId]);

  const exportResults = async () => {
    try { setExporting(true); setError(""); await downloadSurveyResults(organization.id, surveyId, survey.title); }
    catch (exportError) { setError(exportError.message || "Could not export responses"); }
    finally { setExporting(false); }
  };

  if (!survey && !error) return <OrganizationLoadingState title="Calculating survey results" />;
  return <div className="premium-page"><div className="premium-container">
    <Link to="/backoffice/surveys" className="org-survey-back"><OrgIcon name="arrowLeft" size={16} /> Survey workspace</Link>
    <OrganizationPageHeader variant="admin" eyebrow="Survey results" title={survey?.title || "Results unavailable"}
      description={survey ? `${survey.responseCount} member response${survey.responseCount === 1 ? "" : "s"}.` : "The results could not be loaded."}
      organization={organization} logoUrl={settings.logoUrl}
      actions={survey && <button type="button" disabled={exporting} onClick={exportResults} className="org-ui-button org-ui-button--primary"><OrgIcon name="download" size={17} /> {exporting ? "Exporting..." : "Export CSV"}</button>} />
    {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
    {survey && <div className="org-survey-results-grid">{survey.questions.map((question) => <article className="premium-card org-survey-results-card" key={question.id}>
      <span className="org-ui-eyebrow">{pretty(question.type)}</span><h2>{question.prompt}</h2>
      {Object.entries(question.resultCounts || {}).length > 0 && <div className="org-survey-bars">{Object.entries(question.resultCounts).map(([answer, count]) => {
        const percentage = survey.responseCount ? Math.round((count / survey.responseCount) * 100) : 0;
        return <div key={answer}><div><span>{answer}</span><strong>{count} · {percentage}%</strong></div><div className="premium-progress"><span style={{ width: `${percentage}%` }} /></div></div>;
      })}</div>}
      {question.textResults?.length > 0 && <div className="org-survey-text-results">{question.textResults.map((answer, index) => <blockquote key={index}>{answer}</blockquote>)}</div>}
      {Object.entries(question.resultCounts || {}).length === 0 && !question.textResults?.length && <p>No answers recorded for this question.</p>}
    </article>)}</div>}
  </div></div>;
}

function pretty(value) { return String(value || "").toLowerCase().replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase()); }
export default OrganizationSurveyResultsPage;
