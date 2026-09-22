import { Accordion } from '@mantine/core';
import useContent from '../hooks/useContent';
import { ContentState } from './ContentPage';
import RichText from './RichText';

export default function CmsFaqs({ topic, optional = false }) {
  const query = useContent('faqs');
  const items = (query.data || []).filter((item) => !topic || item.topics.includes(topic));
  if (optional && !items.length) return null;
  return (
    <section aria-label="Frequently asked questions">
      <ContentState
        {...query}
        status={query.status === 'ready' && !items.length ? 'empty' : query.status}
        message="Answers are being prepared. Please contact us with your question."
      />
      <Accordion variant="separated">
        {items.map((item) => (
          <Accordion.Item value={String(item.id)} key={item.id}>
            <Accordion.Control>{item.title}</Accordion.Control>
            <Accordion.Panel>
              <RichText html={item.body} />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}
