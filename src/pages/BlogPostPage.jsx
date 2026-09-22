import PageMetadata from '../components/PageMetadata';
import { Alert, Button, Container } from '@mantine/core';
import { Link } from 'react-router';
import usePosts from '../hooks/usePosts';
import { postDate } from '../services/posts';
import LoadingImage from '../components/LoadingImage';
import RichText from '../components/RichText';
import SkeletonBlock from '../components/skeletons/SkeletonBlock';
import SkeletonRegion from '../components/skeletons/SkeletonRegion';
import classes from './BlogPage.module.css';

export default function BlogPostPage({ slug }) {
  const { data: post, status, retry } = usePosts({ slug });
  return (
    <Container size={860} className={classes.article}>
      <PageMetadata
        content={post}
        title={post?.title || 'Blog'}
        path={`/blog/${encodeURIComponent(slug)}`}
      />
      <Link className={classes.back} to="/blog">
        ← Back to blog
      </Link>
      {status === 'loading' ? (
        <SkeletonRegion label="Loading article">
          <SkeletonBlock height={80} />
          <SkeletonBlock height={18} width="30%" mt={20} />
          <SkeletonBlock height={240} mt={32} />
          <SkeletonBlock height={180} mt={32} />
        </SkeletonRegion>
      ) : status === 'error' ? (
        <Alert title="Article is temporarily unavailable" color="yellow" role="alert">
          <Button variant="light" onClick={() => retry()}>
            Retry article
          </Button>
        </Alert>
      ) : !post ? (
        <div>
          <h1>Article not found</h1>
          <p>This article may have been removed or is not yet published.</p>
        </div>
      ) : (
        <article>
          <header>
            <p className={classes.category}>{post.categories.join(' · ')}</p>
            <h1>{post.title}</h1>
            <time
              className={classes.date}
              dateTime={/^\d{4}-/.test(post.date) ? post.date : undefined}
            >
              {postDate(post.date)}
            </time>
          </header>
          {post.image.src && (
            <LoadingImage
              src={post.image.src}
              alt={post.image.alt || post.title}
              className={classes.heroImage}
            />
          )}
          <RichText html={post.body} className={classes.body} />
        </article>
      )}
    </Container>
  );
}
