import LoadingImage from './LoadingImage';
import classes from './EbookCardMedia.module.css';

export default function EbookCardMedia({ product, fallback }) {
  return (
    <LoadingImage
      src={product.image || product.thumbnail}
      alt={product.imageAlt || `${product.name} — ebook cover`}
      className={classes.stage}
      imageClassName={classes.cover}
      fit="contain"
      loading="lazy"
      fallback={fallback}
    />
  );
}
