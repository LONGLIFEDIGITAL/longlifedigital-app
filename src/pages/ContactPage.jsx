import useContent from '../hooks/useContent';
import { PageHeader, ContentState, PageCta } from '../components/ContentPage';
import RichText from '../components/RichText';
import { Alert, Box, Button, Container, Flex, Input, SimpleGrid, Text, Title } from '@mantine/core';
import { useState } from 'react';
import usePublicForm from '../hooks/usePublicForm';
import classes from './ContactPage.module.css';
export default function ContactPage({ fire, contact, settings }) {
  const [cf, setCf] = useState({
    name: '',
    email: '',
    service: '',
    message: '',
  });
  const [sent, setSent] = useState(false);
  const request = usePublicForm('contact');
  const content = useContent('page', 'contact');
  const services = useContent('services');
  async function submit(event) {
    event.preventDefault();
    const website = new FormData(event.currentTarget).get('website') || '';
    if (await request.submit({ ...cf, website })) {
      setSent(true);
      setCf({ name: '', email: '', service: '', message: '' });
      fire(content.data?.contact.success_body || 'Your message has been sent.');
    }
  }
  return (
    <div>
      <PageHeader pageKey="contact" content={content.data} />
      <Container p="60px 24px">
        <ContentState {...content} />
        {content.data?.body && <RichText html={content.data.body} />}
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
                borderRadius: '1.25rem',
                border: '1px solid rgba(201,150,63,0.2)',
              }}
            >
              <Title order={3} c="#fff" fz={22} ff="'Plus Jakarta Sans',sans-serif" mb={28}>
                {content.data?.contact.information_heading || 'Contact Information'}
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
                  val: Object.values(settings.social || {}).some(Boolean) ? '' : contact.social,
                  link: '',
                },
                ...[
                  ['instagram', 'Instagram', '◎'],
                  ['facebook', 'Facebook', 'f'],
                  ['tiktok', 'TikTok', '♪'],
                  ['youtube', 'YouTube', '▶'],
                  ['linkedin', 'LinkedIn', 'in'],
                ]
                  .filter(([platform]) => settings.social?.[platform])
                  .map(([platform, label, icon]) => ({
                    icon,
                    label,
                    val: settings.social[platform]
                      .replace(/^https:\/\/(?:www\.)?/, '')
                      .replace(/\/$/, ''),
                    link: settings.social[platform],
                  })),
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
                      gap: '0.875rem',
                      marginBottom: '1.25rem',
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
              borderRadius: '1.25rem',
              border: '1px solid rgba(201,150,63,0.15)',
              boxShadow: '0 8px 40px rgba(147,51,234,0.08)',
            }}
          >
            <Box
              bg="linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#C9963F,#E8C97A,#9333EA,#C084FC) border-box"
              pos="absolute"
              style={{
                inset: 0,
                borderRadius: '1.25rem',
                border: '1.5px solid transparent',
                pointerEvents: 'none',
              }}
            />
            {sent ? (
              <Box ta="center" p="40px 0" role="status">
                <Box fz={48} mb={16}>
                  ✦
                </Box>
                <Title order={3} c="#9333EA" fz={24} ff="'Plus Jakarta Sans',sans-serif" mb={12}>
                  {content.data?.contact.success_heading || 'Thank you'}
                </Title>
                <Text component="p" inherit c="#9CA3AF" mb={24}>
                  {content.data?.contact.success_body ||
                    'Your message has been sent. We’ll reply using the email address you provided.'}
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
              <Box pos="relative" component="form" onSubmit={submit}>
                <Title order={3} c="#1a0533" fz={20} ff="'Plus Jakarta Sans',sans-serif" mb={20}>
                  {content.data?.contact.form_heading || 'Send Us a Message'}
                </Title>
                {content.data?.contact.form_intro && (
                  <Text mb="md">{content.data.contact.form_intro}</Text>
                )}
                {request.error && (
                  <Alert color="red" role="alert" mb="md">
                    {request.error}
                  </Alert>
                )}
                <fieldset
                  disabled={request.busy}
                  style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
                >
                  <input
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ display: 'none' }}
                  />
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
                        htmlFor="contact-name"
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
                        id="contact-name"
                        name="name"
                        autoComplete="name"
                        required
                        maxLength={100}
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
                        htmlFor="contact-email"
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
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
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
                        htmlFor="contact-service"
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
                        id="contact-service"
                        name="service"
                        onChange={(e) =>
                          setCf({
                            ...cf,
                            service: e.target.value,
                          })
                        }
                        component="select"
                      >
                        <option value="">Select a service...</option>
                        {(services.data || []).map((service) => (
                          <option key={service.id} value={service.title}>
                            {service.title}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </Input>
                    </div>
                  </SimpleGrid>
                  <Box
                    component="label"
                    htmlFor="contact-message"
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
                    id="contact-message"
                    name="message"
                    required
                    maxLength={5000}
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
                        height: '7.5rem',
                        resize: 'vertical',
                      },
                    }}
                  />
                  <Button
                    className="btn-h"
                    loading={request.busy}
                    variant="filled"
                    color="brand"
                    px="lg"
                    type="submit"
                    w="100%"
                    mt={16}
                    p="14px"
                  >
                    ✦ Send Message
                  </Button>
                </fieldset>
              </Box>
            )}
          </Box>
        </SimpleGrid>
        <PageCta cta={content.data?.cta} />
      </Container>
    </div>
  );
}
