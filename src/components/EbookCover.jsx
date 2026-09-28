import LoadingImage from './LoadingImage';
import classes from './EbookCover.module.css';

export default function EbookCover({ product }) {
  return (
    <div className={classes.stage}>
      <div className={classes.orbit} aria-hidden="true" />
      <span className={classes.spark} aria-hidden="true">
        ✦
      </span>
      <div className={classes.backBook} aria-hidden="true" />
      <div className={classes.frontBook}>
        {product.image ? (
          <LoadingImage
            src={product.image}
            alt={product.imageAlt || `${product.name} — ebook cover`}
            className={classes.cover}
            fit="contain"
          />
        ) : (
          <div className={classes.placeholder}>
            <span>E-BOOK</span>
            <strong>{product.name}</strong>
            <span aria-hidden="true">✦</span>
          </div>
        )}
      </div>
      {product.tag && <span className={classes.caption}>{product.tag}</span>}
    </div>
  );
}
