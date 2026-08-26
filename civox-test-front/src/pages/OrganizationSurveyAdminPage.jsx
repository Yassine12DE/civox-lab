import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  OrgIcon,
  OrganizationEmptyState,
  OrganizationLoadingState,
  OrganizationNotice,
  OrganizationPageHeader,
  OrganizationStatusPill,
} from "../components/organization/OrganizationUi";
import { getOrganizationSurveys, updateSurvey } from "../services/surveyService";

function OrganizationSurveyAdminPage() {
  const { organization, settings } = useOutletContext();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); setSurveys(await getOrganizationSurveys(organization.id)); }
    catch (loadError) { setError(loadError.message || "Could not load surveys"); }
    finally { setLoading(false); }
  }, [organization.id]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (survey, status) => {
    try {
      setUpdatingId(survey.id);
      const updated = await updateSurvey(organization.id, survey.id, {
        title: survey.title, description: survey.description, status,
        openingAt: survey.openingAt, closingAt: survey.closingAt,
        resultVisibility: survey.resultVisibility, featured: survey.featured,
        questions: survey.questions.map((question) => ({
          prompt: question.prompt, type: question.type, required: question.required, options: question.options,
        })),
      });
      setSurveys((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (updateError) { setError(updateError.message || "Could not update survey"); }
    finally { setUpdatingId(null); }
  };

  if (loading) return <OrganizationLoadingState title="Loading survey workspace" />;
  return <div className="premium-page"><div className="premium-container">
    <OrganizationPageHeader variant="admin" eyebrow="Content / Surveys" title="Surveys"
      description="Draft, schedule, publish, and review structured member feedback."
      organization={organization} logoUrl={settings.logoUrl}
      actions={<Link to="/backoffice/surveys/new" className="org-ui-button org-ui-button--primary"><OrgIcon name="plus" size={17} /> New survey</Link>} />
    {error && <OrganizationNotice tone="error">{error}</OrganizationNotice>}
    {surveys.length === 0 ? <OrganizationEmptyState title="No surveys yet" message="Create a draft and add questions before publishing." actionLabel="Create survey" actionTo="/backoffice/surveys/new" icon="file" /> :
      <div className="premium-table-card"><div className="premium-table-wrap"><table className="premium-table"><thead><tr><th>Survey</th><th>Status</th><th>Window</th><th>Responses</th><th>Actions</th></tr></thead><tbody>
        {surveys.map((survey) => <tr key={survey.id}><td><div className="premium-user-cell"><strong>{survey.title}</strong><span>{survey.questions.length} questions {survey.featured ? "• Featured" : ""}</span></div></td>
          <td><OrganizationStatusPill tone={survey.status === "PUBLISHED" ? "success" : "neutral"}>{survey.lifecycle}</OrganizationStatusPill></td>
          <td>{survey.closingAt ? `Until ${formatDate(survey.closingAt)}` : "No deadline"}</td><td>{survey.responseCount}</td>
          <td><div className="org-survey-actions"><Link to={`/backoffice/surveys/${survey.id}/edit`} className="premium-soft-button"><OrgIcon name="edit" size={15} /> Edit</Link>
            <Link to={`/backoffice/surveys/${survey.id}/results`} className="premium-soft-button"><OrgIcon name="barChart" size={15} /> Results</Link>
            {survey.status === "DRAFT" && <button disabled={updatingId === survey.id} onClick={() => changeStatus(survey, "PUBLISHED")} className="premium-soft-button">Publish</button>}
            {survey.status === "PUBLISHED" && <button disabled={updatingId === survey.id} onClick={() => changeStatus(survey, "ARCHIVED")} className="premium-soft-button">Archive</button>}
          </div></td></tr>)}
      </tbody></table></div></div>}
  </div></div>;
}

function formatDate(value) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)); }
export default OrganizationSurveyAdminPage;
