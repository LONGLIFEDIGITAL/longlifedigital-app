import useContent from '../hooks/useContent';
import { PageHeader, PageBody, ContentState } from '../components/ContentPage';
import RichText from '../components/RichText';
import classes from '../components/ContentPage.module.css';

export default function AboutPage({ contact }) {
  const query = useContent('page', 'about');
  const about = query.data?.about;
  return (
    <>
      <PageHeader pageKey="about" content={query.data} />
      <PageBody query={query}>
        {about?.tagline && <p className={classes.intro}>{about.tagline}</p>}
        {about?.sections.map((section) => (
          <section key={section.id} className={classes.section}>
            <h2>
              {section.icon && <span aria-hidden="true">{section.icon} </span>}
              {section.title}
            </h2>
            <RichText html={section.body || section.description} />
          </section>
        ))}
        {query.status === 'ready' && !query.data.body && !about?.sections.length && (
          <ContentState status="empty" />
        )}
        {contact?.email && (
          <section className={classes.section}>
            <h2>Contact Us</h2>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </section>
        )}
      </PageBody>
    </>
  );
}
