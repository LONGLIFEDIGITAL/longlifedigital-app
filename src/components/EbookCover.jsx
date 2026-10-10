import LoadingImage from './LoadingImage';
import classes from './EbookCover.module.css';

export default function EbookCover({ product, onPreview }) {
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
      {onPreview && (
        <button
          type="button"
          className={classes.previewTrigger}
          onClick={onPreview}
          aria-label={`Preview ${product.name}`}
          aria-haspopup="dialog"
        >
          <span className={classes.previewHint} aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 13V4a2 2 0 0 1 4 0v6l6 1a3 3 0 0 1 2.5 3v2a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.7-2.3L4 14a2 2 0 0 1 3-2.5L8 13Z" />
              <path d="M12 10v4m4-3.3V14" />
            </svg>
            <span>Preview</span>
          </span>
        </button>
      )}
    </div>
  );
}
