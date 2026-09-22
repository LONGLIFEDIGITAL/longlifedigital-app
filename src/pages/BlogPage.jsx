import useContent from '../hooks/useContent';
import { PageHeader, ContentState, PageCta } from '../components/ContentPage';
import RichText from '../components/RichText';
import { useState } from 'react';
import { Container, Pagination } from '@mantine/core';
import BlogCards from '../components/BlogCards';
import usePosts from '../hooks/usePosts';
import classes from './BlogPage.module.css';

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const content = useContent('page', 'blog');
  const posts = usePosts({ page });
  return (
    <div>
      <PageHeader pageKey="blog" content={content.data} />
      <Container className={classes.list}>
        <ContentState {...content} />
        {content.data?.body && <RichText html={content.data.body} />}
        <BlogCards {...posts} />
        {(posts.data?.totalPages > 1 || page > 1) && (
          <Pagination
            className={classes.pagination}
            value={page}
            total={Math.max(page, posts.data?.totalPages || 1)}
            onChange={(value) => {
              setPage(value);
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            aria-label="Blog pages"
          />
        )}
        <PageCta cta={content.data?.cta} />
      </Container>
    </div>
  );
}
