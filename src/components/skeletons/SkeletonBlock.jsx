import { Skeleton } from '@mantine/core';
import classes from './Skeletons.module.css';

export default function SkeletonBlock({ className = '', tone, ...props }) {
  return (
    <Skeleton
      {...props}
      className={`${classes.block} ${className}`}
      data-tone={tone}
      aria-hidden="true"
    />
  );
}
