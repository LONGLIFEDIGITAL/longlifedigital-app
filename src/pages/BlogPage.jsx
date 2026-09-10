import { Box, Button, Container, Flex, SimpleGrid, Text, Title } from '@mantine/core';
import { BLOG_POSTS } from '../constants/data';
export default function BlogPage() {
  return (
    <div>
      <Box
        py={{
          base: 32,
          sm: 40,
        }}
        bg="#F9FAFB"
        style={{
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <Container>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Blog
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            Tips, guides and strategies for digital entrepreneurs
          </Text>
        </Container>
      </Box>
      <Container p="48px 24px">
        <SimpleGrid minColWidth="min(100%, 300px)" spacing={24}>
          {BLOG_POSTS.map((post) => (
            <Box
              key={post.id}
              className="pcard"
              bg="#fff"
              style={{
                border: '1px solid #F3F4F6',
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'all 0.3s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <Flex
                align="center"
                justify="center"
                wrap="wrap"
                bg="linear-gradient(135deg,#F3EEFF,#EDE9FE)"
                h={160}
              >
                <Text component="span" inherit fz={56}>
                  {post.img}
                </Text>
              </Flex>
              <Box p="20px">
                <Text
                  component="span"
                  inherit
                  c="#9333EA"
                  bg="#F3EEFF"
                  fz={11}
                  fw="600"
                  mb={8}
                  p="3px 10px"
                  style={{
                    borderRadius: 20,
                    display: 'inline-block',
                  }}
                >
                  {post.tag}
                </Text>
                <Box c="#9CA3AF" fz={12} mb={10}>
                  {post.date}
                </Box>
                <Title
                  order={3}
                  c="#111827"
                  fz={16}
                  fw="700"
                  ff="'Playfair Display',serif"
                  lh={1.4}
                  mb={10}
                >
                  {post.title}
                </Title>
                <Text component="p" inherit c="#6B7280" fz={13} lh={1.65} mb={14}>
                  {post.excerpt}
                </Text>
                <Button
                  className="btn-h"
                  variant="transparent"
                  color="dark"
                  px={0}
                  type="button"
                  c="#9333EA"
                  bg="none"
                  fz={13}
                  fw="600"
                  ff="'Inter',sans-serif"
                  p={0}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Read More →
                </Button>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </div>
  );
}
