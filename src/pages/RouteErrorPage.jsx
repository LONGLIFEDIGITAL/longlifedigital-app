import { useLayoutEffect, useRef } from 'react';
import { Box, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';

export default function RouteErrorPage() {
  const heading = useRef(null);

  useLayoutEffect(() => {
    // The app may fail before it can remove the published HTML itself.
    document.getElementById('initial-content')?.remove();
    heading.current?.focus();
  }, []);

  return (
    <Box
      component="main"
      id="main-content"
      mih="100svh"
      bg="brand.0"
      py="xl"
      style={{ display: 'grid', placeItems: 'center' }}
    >
      <Container size="sm" w="100%">
        <Paper withBorder radius="lg" p={{ base: 'lg', sm: 'xl' }} shadow="sm">
          <Stack align="center" gap="lg" ta="center">
            <Text fw={700} c="brand.7">
              Longlife Digital
            </Text>
            <Title order={1} size="h2" ref={heading} tabIndex={-1}>
              We couldn’t load this page
            </Title>
            <Text c="dimmed" maw={440}>
              Please reload the page to try again. If the problem continues, try again in a few
              minutes.
            </Text>
            <Group justify="center">
              <Button onClick={() => window.location.reload()}>Reload page</Button>
              {/* A full navigation also clears a failed lazy import cached by React. */}
              <Button component="a" href="/" variant="light">
                Back to home
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
