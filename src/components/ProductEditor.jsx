import ResponsiveModal from './ResponsiveModal';
import { ActionIcon, Box, Button, Flex, Input, SimpleGrid, Title } from '@mantine/core';
import { CATS } from '../constants/data';
import LDLogo from './LDLogo';
export default function ProductEditor({ editId, form, saveProduct, setForm, setShowForm }) {
  return (
    <ResponsiveModal
      onClose={() => setShowForm(false)}
      size={540}
      zIndex={200}
      label="Product editor"
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        p={{
          base: 20,
          sm: 32,
        }}
        bg="#fff"
        pos="relative"
        style={{
          borderRadius: '1rem',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        }}
      >
        <ActionIcon
          onClick={() => setShowForm(false)}
          variant="transparent"
          color="dark"
          px={0}
          type="button"
          c="#374151"
          bg="#F9FAFB"
          fz={13}
          ff="'Inter',sans-serif"
          w={30}
          h={30}
          pos="absolute"
          top={14}
          right={14}
          style={{
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
          aria-label="Close dialog"
        >
          ✕
        </ActionIcon>
        <Flex align="center" gap={10} wrap="wrap" mb={22}>
          <LDLogo size={32} />
          <Title order={2} c="#111827" fz={20} fw="700" ff="'Plus Jakarta Sans',sans-serif">
            {editId ? 'Edit Product' : 'Add New Product'}
          </Title>
        </Flex>
        <Box
          bg="#F9FAFB"
          mb={12}
          p="16px"
          style={{
            border: '1px solid #F3F4F6',
            borderRadius: '0.625rem',
          }}
        >
          <Box c="#111827" fz={13} fw="700" mb={12}>
            Basic Information
          </Box>
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
            Category *
          </Box>
          <Input
            className="inp-f"
            value={form.cat}
            onChange={(e) =>
              setForm({
                ...form,
                cat: e.target.value,
              })
            }
            component="select"
          >
            {CATS.filter((c) => c.id !== 'all').map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </Input>
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
            Product Name *
          </Box>
          <Input
            className="inp-f"
            placeholder="e.g. The AI Prompt Bible"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
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
                Price (USD) *
              </Box>
              <Input
                className="inp-f"
                placeholder="e.g. 29"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
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
                Original Price (for sale)
              </Box>
              <Input
                className="inp-f"
                placeholder="e.g. 58"
                value={form.oldPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    oldPrice: e.target.value,
                  })
                }
              />
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
            Description *
          </Box>
          <Input
            className="inp-f"
            placeholder="Describe your product..."
            value={form.desc}
            onChange={(e) =>
              setForm({
                ...form,
                desc: e.target.value,
              })
            }
            component="textarea"
            styles={{
              input: {
                height: '5rem',
                resize: 'vertical',
              },
            }}
          />
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
            Badge (e.g. Best Seller, New, Hot)
          </Box>
          <Input
            className="inp-f"
            placeholder="e.g. Best Seller"
            value={form.tag}
            onChange={(e) =>
              setForm({
                ...form,
                tag: e.target.value,
              })
            }
          />
          <Flex align="center" gap={10} wrap="wrap" mt={12}>
            <input
              type="checkbox"
              id="feat"
              checked={form.featured}
              onChange={(e) =>
                setForm({
                  ...form,
                  featured: e.target.checked,
                })
              }
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#9333EA',
              }}
            />
            <Box
              htmlFor="feat"
              component="label"
              c="#6B7280"
              fz={13}
              style={{
                cursor: 'pointer',
              }}
            >
              ⭐ Show on Featured section
            </Box>
          </Flex>
        </Box>
        <Box
          bg="#F9FAFB"
          mb={12}
          p="16px"
          style={{
            border: '1px solid #F3F4F6',
            borderRadius: '0.625rem',
          }}
        >
          <Box c="#111827" fz={13} fw="700" mb={12}>
            Product Details
          </Box>
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
                Level
              </Box>
              <Input
                className="inp-f"
                placeholder="e.g. Beginner"
                value={form.level}
                onChange={(e) =>
                  setForm({
                    ...form,
                    level: e.target.value,
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
                Duration
              </Box>
              <Input
                className="inp-f"
                placeholder="e.g. 8 Weeks"
                value={form.duration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration: e.target.value,
                  })
                }
              />
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
            What's Included (comma separated)
          </Box>
          <Input
            className="inp-f"
            placeholder="e.g. PDF guide, templates"
            value={form.includes}
            onChange={(e) =>
              setForm({
                ...form,
                includes: e.target.value,
              })
            }
          />
        </Box>
        <Box
          bg="#F9FAFB"
          mb={12}
          p="16px"
          style={{
            border: '1px solid #F3F4F6',
            borderRadius: '0.625rem',
          }}
        >
          <Box c="#111827" fz={13} fw="700" mb={12}>
            Payment Links
          </Box>
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
            Payhip Product URL
          </Box>
          <Input
            className="inp-f"
            placeholder="https://payhip.com/b/xxxxx"
            value={form.payhipUrl}
            onChange={(e) =>
              setForm({
                ...form,
                payhipUrl: e.target.value,
              })
            }
          />
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
            Stripe Payment URL
          </Box>
          <Input
            className="inp-f"
            placeholder="https://buy.stripe.com/xxxxx"
            value={form.stripeUrl}
            onChange={(e) =>
              setForm({
                ...form,
                stripeUrl: e.target.value,
              })
            }
          />
        </Box>
        <Flex gap={12} wrap="wrap" mt={8}>
          <Button
            className="btn-h"
            onClick={saveProduct}
            variant="filled"
            color="brand"
            px="lg"
            type="button"
            flex={1}
          >
            {editId ? 'Save Changes' : 'Publish Product'}
          </Button>
          <Button
            className="btn-h"
            onClick={() => setShowForm(false)}
            variant="light"
            color="red"
            px="lg"
            type="button"
          >
            Cancel
          </Button>
        </Flex>
      </Box>
    </ResponsiveModal>
  );
}
