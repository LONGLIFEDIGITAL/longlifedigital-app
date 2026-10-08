import useContent from '../hooks/useContent';
import { PageHeader, PageBody, ContentState } from './ContentPage';
import classes from './ContentPage.module.css';

export default function PolicyPage({ pageKey }) {
  const query = useContent('page', pageKey);
  const policy = query.data?.policy;
  return (
    <>
      <PageHeader pageKey={pageKey} content={query.data} />
      <PageBody query={query}>
        {policy?.updatedOn && (
          <p>
            Last updated: <time>{policy.updatedOn}</time>
          </p>
        )}
        {query.status === 'ready' && !query.data.body && (
          <ContentState
            status="empty"
            message="This policy is being prepared. Please contact us if you need further information."
          />
        )}
        {(policy?.heading || policy?.body) && (
          <aside className={classes.section}>
            {policy.heading && <h2>{policy.heading}</h2>}
            {policy.body && <p className={classes.intro}>{policy.body}</p>}
          </aside>
        )}
      </PageBody>
    </>
  );
}
