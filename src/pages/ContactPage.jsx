import { Box, Button, Container, Flex, Input, SimpleGrid, Text, Title } from '@mantine/core';
import { useState } from 'react';
import classes from './ContactPage.module.css';
export default function ContactPage({ fire, contact, settings }) {
  const [cf, setCf] = useState({
    name: '',
    email: '',
    service: '',
    message: '',
  });
  const [sent, setSent] = useState(false);
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
          <Box c="#9333EA" fz={11} fw="600" lts={2} tt="uppercase" mb={8}>
            ✦ GET IN TOUCH ✦
          </Box>
          <Title
            order={1}
            c="#111827"
            fz="clamp(28px,5vw,48px)"
            fw="700"
            ff="'Playfair Display',serif"
            mb={8}
          >
            Contact Us
          </Title>
          <Text component="p" inherit c="#9CA3AF" fz={15}>
            {contact.responseNote}
          </Text>
        </Container>
      </Box>
      <Container p="60px 24px">
        <SimpleGrid
          cols={{
            base: 1,
            md: 2,
          }}
          spacing={{
            base: 24,
            md: 48,
          }}
          style={{
            alignItems: 'start',
          }}
        >
          <div>
            <Box
              bg="linear-gradient(135deg,#1a0533,#2d1066)"
              p="36px"
              style={{
                borderRadius: 20,
                border: '1px solid rgba(201,150,63,0.2)',
              }}
            >
              <Title order={3} c="#fff" fz={22} ff="'Playfair Display',serif" mb={28}>
                Contact Information
              </Title>
              {[
                {
                  icon: '✉',
                  label: 'Email',
                  val: contact.email,
                  link: contact.email ? `mailto:${contact.email}` : '',
                },
                {
                  icon: '◎',
                  label: 'Social',
                  val: contact.social,
                  link: settings.social.instagram,
                },
                {
                  icon: '🌐',
                  label: 'Website',
                  val: contact.website,
                  link: settings.brand.website,
                },
              ]
                .filter(({ val }) => val)
                .map(({ icon, label, val, link }) => (
                  <Box
                    component={link ? 'a' : 'div'}
                    key={label}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginBottom: 20,
                      textDecoration: 'none',
                    }}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      wrap="wrap"
                      c="#1a0533"
                      bg="linear-gradient(135deg,#C9963F,#E8C97A)"
                      fz={16}
                      w={42}
                      h={42}
                      style={{
                        borderRadius: '50%',
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </Flex>
                    <div className={classes.contactValue}>
                      <Box c="#6D28D9" fz={10} lts={2} tt="uppercase" mb={3}>
                        {label}
                      </Box>
                      <Box c="#DDD6FE" fz={14} fw={500}>
                        {val}
                      </Box>
                    </div>
                  </Box>
                ))}
              {(contact.responseNote || contact.hours) && (
                <Box
                  mt={28}
                  pt={20}
                  style={{
                    borderTop: '1px solid rgba(201,150,63,0.15)',
                  }}
                >
                  <Box c="#E8C97A" fz={11} lts={1} mb={8}>
                    ⏱ RESPONSE TIME
                  </Box>
                  <Box c="#C084FC" fz={13}>
                    {contact.hours || contact.responseNote}
                  </Box>
                </Box>
              )}
            </Box>
          </div>
          <Box
            bg="#fff"
            p="36px"
            pos="relative"
            style={{
              borderRadius: 20,
              border: '1px solid rgba(201,150,63,0.15)',
              boxShadow: '0 8px 40px rgba(147,51,234,0.08)',
            }}
          >
            <Box
              bg="linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#C9963F,#E8C97A,#9333EA,#C084FC) border-box"
              pos="absolute"
              style={{
                inset: 0,
                borderRadius: 20,
                border: '1.5px solid transparent',
                pointerEvents: 'none',
              }}
            />
            {sent ? (
              <Box ta="center" p="40px 0">
                <Box fz={48} mb={16}>
                  ✦
                </Box>
                <Title order={3} c="#9333EA" fz={24} ff="'Playfair Display',serif" mb={12}>
                  Message Sent!
                </Title>
                <Text component="p" inherit c="#9CA3AF" mb={24}>
                  Thank you! We will reply within 24 hours.
                </Text>
                <Button
                  className="btn-h"
                  onClick={() => setSent(false)}
                  variant="filled"
                  color="brand"
                  px="lg"
                  type="button"
                >
                  Send Another
                </Button>
              </Box>
            ) : (
              <Box pos="relative">
                <Title order={3} c="#1a0533" fz={20} ff="'Playfair Display',serif" mb={20}>
                  Send Us a Message
                </Title>
                <SimpleGrid
                  cols={{
                    base: 1,
                    sm: 2,
                  }}
                  spacing={12}
                >
                  <div>
                    <Box
                      component="label"
                      c="#9CA3AF"
                      fz={11}
                      lts={1}
                      tt="uppercase"
                      mt={10}
                      mb={5}
                      style={{
                        display: 'block',
                      }}
                    >
                      Your Name *
                    </Box>
                    <Input
                      className="inp-f"
                      placeholder="John Smith"
                      value={cf.name}
                      onChange={(e) =>
                        setCf({
                          ...cf,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Box
                      component="label"
                      c="#9CA3AF"
                      fz={11}
                      lts={1}
                      tt="uppercase"
                      mt={10}
                      mb={5}
                      style={{
                        display: 'block',
                      }}
                    >
                      Email *
                    </Box>
                    <Input
                      className="inp-f"
                      placeholder="john@email.com"
                      value={cf.email}
                      onChange={(e) =>
                        setCf({
                          ...cf,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </SimpleGrid>
                <SimpleGrid
                  cols={{
                    base: 1,
                    sm: 2,
                  }}
                  spacing={12}
                >
                  <div>
                    <Box
                      component="label"
                      c="#9CA3AF"
                      fz={11}
                      lts={1}
                      tt="uppercase"
                      mt={10}
                      mb={5}
                      style={{
                        display: 'block',
                      }}
                    >
                      Service Interested In
                    </Box>
                    <Input
                      className="inp-f"
                      value={cf.service}
                      onChange={(e) =>
                        setCf({
                          ...cf,
                          service: e.target.value,
                        })
                      }
                      component="select"
                    >
                      <option value="">Select a service...</option>
                      {[
                        'Affiliate Marketing',
                        'SEO',
                        'LLC Formation',
                        'Website Design',
                        'Social Media Management',
                        'Google Business',
                        'Facebook & Google Ads',
                        'AI Automation',
                        'Branding & Design',
                        'Digital Product Creation',
                        'Domain Purchase',
                        'Other',
                      ].map((sv) => (
                        <option key={sv} value={sv}>
                          {sv}
                        </option>
                      ))}
                    </Input>
                  </div>
                </SimpleGrid>
                <Box
                  component="label"
                  c="#9CA3AF"
                  fz={11}
                  lts={1}
                  tt="uppercase"
                  mt={10}
                  mb={5}
                  style={{
                    display: 'block',
                  }}
                >
                  Message *
                </Box>
                <Input
                  className="inp-f"
                  placeholder="Tell us about your project or question..."
                  value={cf.message}
                  onChange={(e) =>
                    setCf({
                      ...cf,
                      message: e.target.value,
                    })
                  }
                  component="textarea"
                  styles={{
                    input: {
                      height: 120,
                      resize: 'vertical',
                    },
                  }}
                />
                <Button
                  className="btn-h"
                  onClick={() => {
                    if (cf.name && cf.email && cf.message) {
                      setSent(true);
                      fire('Message sent! We will reply within 24 hours. ✦');
                    } else {
                      fire('Please fill all required fields.', 'err');
                    }
                  }}
                  variant="filled"
                  color="brand"
                  px="lg"
                  type="button"
                  w="100%"
                  mt={16}
                  p="14px"
                >
                  ✦ Send Message
                </Button>
              </Box>
            )}
          </Box>
        </SimpleGrid>
      </Container>
    </div>
  );
}
