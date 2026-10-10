import { useState } from 'react';
import { ActionIcon, Anchor, Button, Group, Modal, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import LoadingImage from './LoadingImage';
import EbookCover from './EbookCover';
import ArrowIcon from './ArrowIcon';
import classes from './EbookPreview.module.css';

function PageArrow({ previous = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={previous ? 'M19 12H5m7-7-7 7 7 7' : 'M5 12h14m-7-7 7 7-7 7'} />
    </svg>
  );
}

export default function EbookPreview({ product }) {
  const [opened, setOpened] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [retry, setRetry] = useState(0);
  const mobile = useMediaQuery('(max-width: 47.99em)');
  const pages = product.previewPages || [];
  const currentIndex = Math.min(pageIndex, pages.length - 1);
  const page = pages[currentIndex];

  if (!page) return <EbookCover product={product} />;

  return (
    <>
      <EbookCover
        product={product}
        onPreview={() => {
          setPageIndex(0);
          setRetry(0);
          setOpened(true);
        }}
      />
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Inside ${product.name}`}
        size="54rem"
        fullScreen={mobile}
        centered
        zIndex={400}
        closeButtonProps={{ 'aria-label': 'Close ebook preview' }}
        overlayProps={{ backgroundOpacity: 0.65, blur: 6 }}
        classNames={{ title: classes.title, body: classes.body }}
      >
        {opened && (
          <>
            <div className={classes.toolbar}>
              <Text size="sm" fw={600} role="status" aria-live="polite" aria-atomic="true">
                Sample {currentIndex + 1} of {pages.length}
              </Text>
              {pages.length > 1 && (
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    type="button"
                    variant="subtle"
                    size={44}
                    className={classes.pageArrow}
                    aria-label="Previous page"
                    disabled={currentIndex === 0}
                    onClick={() => setPageIndex(currentIndex - 1)}
                  >
                    <PageArrow previous />
                  </ActionIcon>
                  <ActionIcon
                    type="button"
                    variant="subtle"
                    size={44}
                    className={classes.pageArrow}
                    aria-label="Next page"
                    disabled={currentIndex === pages.length - 1}
                    onClick={() => setPageIndex(currentIndex + 1)}
                  >
                    <PageArrow />
                  </ActionIcon>
                </Group>
              )}
              <Anchor
                href={page.src}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                className={classes.fullSizeLink}
              >
                Open page full size <ArrowIcon />
              </Anchor>
            </div>
            <LoadingImage
              key={`${page.src}:${retry}`}
              src={page.src}
              alt={page.alt || `${product.name} — sample page ${currentIndex + 1}`}
              className={classes.page}
              style={{
                aspectRatio: page.width && page.height ? `${page.width} / ${page.height}` : '3 / 4',
              }}
              fit="contain"
              fallback={
                <div className={classes.unavailable} role="alert">
                  <Text>This preview page couldn’t load.</Text>
                  <Button type="button" variant="light" onClick={() => setRetry(retry + 1)}>
                    Try again
                  </Button>
                </div>
              }
            />
          </>
        )}
      </Modal>
    </>
  );
}
