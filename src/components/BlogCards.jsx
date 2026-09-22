import { Alert, Button } from '@mantine/core';
import { Link } from 'react-router';
import { postDate } from '../services/posts';
import LoadingImage from './LoadingImage';
import SkeletonBlock from './skeletons/SkeletonBlock';
import SkeletonRegion from './skeletons/SkeletonRegion';
import classes from './BlogCards.module.css';

export default function BlogCards({ data, status, retry }) {
  if (status === 'loading')
    return (
      <SkeletonRegion label="Loading blog posts">
        <div className={classes.grid}>
          {[0, 1, 2].map((id) => (
            <div key={id} className={classes.card}>
              <SkeletonBlock height={180} radius={0} />
              <div className={classes.details}>
                <SkeletonBlock height={18} width="35%" />
                <SkeletonBlock height={48} mt={16} />
                <SkeletonBlock height={64} mt={16} />
                <SkeletonBlock height={18} width="40%" mt={16} />
              </div>
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  if (status === 'error')
    return (
      <Alert color="yellow" title="Articles are temporarily unavailable" role="alert">
        <Button variant="light" onClick={() => retry()}>
          Retry articles
        </Button>
      </Alert>
    );
  if (!data?.posts.length)
    return <p className={classes.empty}>No articles have been published here yet.</p>;
  return (
    <div className={classes.grid}>
      {data.posts.map((post) => (
        <article key={post.id} className={classes.card}>
          <Link
            to={`/blog/${encodeURIComponent(post.slug)}`}
            tabIndex={-1}
            aria-hidden="true"
            className={classes.imageLink}
          >
            {post.image.src ? (
              <LoadingImage src={post.image.src} alt="" className={classes.image} loading="lazy" />
            ) : (
              <div className={classes.placeholder}>{post.img || '📖'}</div>
            )}
          </Link>
          <div className={classes.details}>
            {!!post.categories.length && (
              <p className={classes.category}>{post.categories.join(' · ')}</p>
            )}
            <time
              className={classes.date}
              dateTime={/^\d{4}-/.test(post.date) ? post.date : undefined}
            >
              {postDate(post.date)}
            </time>
            <h3 className={classes.title}>
              <Link to={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
            </h3>
            {post.excerpt && <p className={classes.excerpt}>{post.excerpt}</p>}
            <Link
              className={classes.readMore}
              to={`/blog/${encodeURIComponent(post.slug)}`}
              aria-label={`Read More: ${post.title}`}
            >
              Read More →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
