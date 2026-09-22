import useContent from '../hooks/useContent';
import { PageHeader, PageBody } from '../components/ContentPage';
import CmsFaqs from '../components/CmsFaqs';
export default function FAQPage() {
  const query = useContent('page', 'faq');
  return (
    <>
      <PageHeader pageKey="faq" content={query.data} />
      <PageBody query={query}>
        <CmsFaqs />
      </PageBody>
    </>
  );
}
