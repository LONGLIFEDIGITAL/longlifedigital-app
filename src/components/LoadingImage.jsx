import { useCallback, useState } from 'react';
import { Box, Image } from '@mantine/core';
import SkeletonBlock from './skeletons/SkeletonBlock';
import classes from './LoadingImage.module.css';

function ImageContent({
  src,
  alt = '',
  className = '',
  fit = 'cover',
  loading = 'eager',
  ...boxProps
}) {
  const [state, setState] = useState('loading');
  const imageRef = useCallback((node) => {
    // Cached images may finish before React attaches the load/error handlers.
    if (node?.complete) setState(node.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  return (
    <Box
      {...boxProps}
      className={`${classes.root} ${className}`}
      data-image-state={state}
      aria-busy={state === 'loading'}
    >
      {state === 'error' ? (
        <div
          className={classes.fallback}
          role={alt ? 'img' : undefined}
          aria-label={alt ? `${alt} (image unavailable)` : undefined}
          aria-hidden={!alt || undefined}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8" cy="8" r="1.5" />
            <path d="m3 17 5-5 4 4 3-3 6 6" />
          </svg>
        </div>
      ) : (
        <Image
          ref={imageRef}
          src={src}
          alt={alt}
          className={classes.image}
          fit={fit}
          loading={loading}
          decoding="async"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
      {state === 'loading' && (
        <SkeletonBlock className={classes.placeholder} height="100%" radius={0} />
      )}
    </Box>
  );
}

export default function LoadingImage(props) {
  // Reset when navigation reuses the view for a different product image.
  return <ImageContent key={props.src} {...props} />;
}
