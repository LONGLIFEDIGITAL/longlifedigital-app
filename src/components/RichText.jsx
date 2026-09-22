import { useMemo } from 'react';
import { sanitizeRichText } from '../utils/richText';
import classes from './RichText.module.css';

export default function RichText({ html, className = '' }) {
  const content = useMemo(() => sanitizeRichText(html || ''), [html]);
  return (
    <div
      className={`${classes.content} ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
