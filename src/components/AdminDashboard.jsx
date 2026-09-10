import ResponsiveModal from './ResponsiveModal';
import { ActionIcon, Box, Button, Flex, Input, SimpleGrid, Text, Title } from '@mantine/core';
import LDLogo from './LDLogo';
export default function AdminDashboard({
  canDo,
  dashTab,
  editMemberId,
  fire,
  memberForm,
  openAdd,
  openDel,
  openEdit,
  orders,
  products,
  setDashTab,
  setEditMemberId,
  setMemberForm,
  setShowDashboard,
  setShowMemberForm,
  setTeamMembers,
  showMemberForm,
  subscribers,
  teamMembers,
  userRole,
}) {
  return (
    <ResponsiveModal
      onClose={() => setShowDashboard(false)}
      size={900}
      zIndex={600}
      label="Longlife Digital Dashboard"
    >
      <Flex
        onClick={(e) => e.stopPropagation()}
        direction="column"
        wrap="nowrap"
        bg="#fff"
        w="100%"
        maw={900}
        mah="90vh"
        m="auto"
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        }}
      >
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          bg="linear-gradient(135deg,#0a0118,#1a0533,#2d1066)"
          p="18px 24px"
          style={{
            flexShrink: 0,
          }}
        >
          <Flex align="center" gap={12} wrap="wrap">
            <LDLogo size={32} />
            <div>
              <Box c="#fff" fz={18} ff="'Playfair Display',serif">
                Longlife Digital Dashboard
              </Box>
              <Box c="#C084FC" fz={11}>
                {userRole === 'owner' ? '👑 Owner' : userRole === 'manager' ? '🛠 Manager' : '🤝 VA'}
              </Box>
            </div>
          </Flex>
          <ActionIcon
            onClick={() => setShowDashboard(false)}
            variant="transparent"
            color="dark"
            px={0}
            type="button"
            c="#fff"
            bg="rgba(255,255,255,0.1)"
            fz={16}
            w={32}
            h={32}
            style={{
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            aria-label="Close dialog"
          >
            ✕
          </ActionIcon>
        </Flex>
        <Flex
          gap={4}
          wrap="wrap"
          bg="#F9FAFB"
          p="0 20px"
          style={{
            borderBottom: '1px solid #E5E7EB',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            canDo('dashboard') && ['overview', '📊', 'Overview'],
            canDo('orders') && ['orders', '🧾', 'Orders'],
            canDo('products') && ['products', '📦', 'Products'],
            canDo('members') && ['members', '👥', 'Team'],
            canDo('subscribers') && ['subs', '✉️', 'Subscribers'],
            canDo('store') && ['store', '⚙️', 'Settings'],
          ]
            .filter(Boolean)
            .map(([id, icon, label]) => (
              <Button
                key={id}
                className="btn-h"
                onClick={() => setDashTab(id)}
                variant="transparent"
                color="dark"
                px={0}
                type="button"
                c={dashTab === id ? '#9333EA' : '#6B7280'}
                bg="transparent"
                fz={12}
                fw={dashTab === id ? 700 : 400}
                p="12px 14px"
                style={{
                  border: 'none',
                  borderBottom: dashTab === id ? '3px solid #9333EA' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon} {label}
              </Button>
            ))}
        </Flex>
        <Box
          p="24px"
          flex={1}
          style={{
            overflowY: 'auto',
          }}
        >
          {dashTab === 'overview' && (
            <div>
              <SimpleGrid minColWidth="min(100%, 140px)" spacing={12} mb={24}>
                {[
                  [
                    '💰',
                    'Revenue',
                    '$' +
                      orders
                        .filter((o) => o.status === 'completed')
                        .reduce((sum, o) => sum + o.amount, 0)
                        .toLocaleString(),
                    '#9333EA',
                    '#F3EEFF',
                  ],
                  ['🧾', 'Orders', orders.length, '#059669', '#ECFDF5'],
                  ['📦', 'Products', products.length, '#0EA5E9', '#EFF6FF'],
                  ['✉️', 'Subscribers', subscribers.length, '#C9963F', '#FFF8EC'],
                  ['👥', 'Team', teamMembers.length, '#7C3AED', '#F5F3FF'],
                ].map(([icon, label, val, color, bg]) => (
                  <Box
                    key={label}
                    bg={bg}
                    p="16px"
                    style={{
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: color + '22',
                    }}
                  >
                    <Box fz={24} mb={6}>
                      {icon}
                    </Box>
                    <Box c={color} fz={24} fw={700} ff="'Playfair Display',serif" mb={2}>
                      {val}
                    </Box>
                    <Box c="#6B7280" fz={11}>
                      {label}
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
              <Box
                style={{
                  border: '1px solid #F3F4F6',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {orders.slice(0, 5).map((o, i) => (
                  <Flex
                    key={o.id}
                    align="center"
                    gap={10}
                    wrap="wrap"
                    bg={i % 2 === 0 ? '#FAFAFA' : '#fff'}
                    p="10px 14px"
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <Text component="span" inherit c="#9333EA" fz={11} fw={700} miw={65}>
                      {o.id}
                    </Text>
                    <Box miw={100} flex={2}>
                      <Box fz={12} fw={600}>
                        {o.customer}
                      </Box>
                      <Box c="#9CA3AF" fz={10}>
                        {o.product.slice(0, 25)}...
                      </Box>
                    </Box>
                    <Text component="span" inherit c="#059669" fw={700}>
                      ${o.amount}
                    </Text>
                    <Text
                      component="span"
                      inherit
                      c={o.status === 'completed' ? '#059669' : '#EF4444'}
                      bg={o.status === 'completed' ? '#ECFDF5' : '#FFF0F0'}
                      fz={10}
                      p="2px 8px"
                      style={{
                        borderRadius: 20,
                      }}
                    >
                      {o.status}
                    </Text>
                  </Flex>
                ))}
              </Box>
            </div>
          )}
          {dashTab === 'orders' && canDo('orders') && (
            <div>
              <Title order={3} c="#1a0533" fz={18} ff="'Playfair Display',serif" mb={14}>
                All Orders
              </Title>
              <Box
                style={{
                  border: '1px solid #F3F4F6',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {orders.map((o, i) => (
                  <Flex
                    key={o.id}
                    align="center"
                    gap={10}
                    wrap="wrap"
                    bg={i % 2 === 0 ? '#FAFAFA' : '#fff'}
                    p="10px 14px"
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <Text component="span" inherit c="#9333EA" fz={11} fw={700} miw={65}>
                      {o.id}
                    </Text>
                    <Box miw={120} flex={2}>
                      <Box fz={12} fw={600}>
                        {o.customer}
                      </Box>
                      <Box c="#9CA3AF" fz={10}>
                        {o.email}
                      </Box>
                    </Box>
                    <Box fz={11} miw={80} flex={2}>
                      {o.product.slice(0, 20)}...
                    </Box>
                    <Text component="span" inherit c="#059669" fz={13} fw={700}>
                      ${o.amount}
                    </Text>
                    <Text
                      component="span"
                      inherit
                      c={o.status === 'completed' ? '#059669' : '#EF4444'}
                      bg={o.status === 'completed' ? '#ECFDF5' : '#FFF0F0'}
                      fz={10}
                      p="2px 8px"
                      style={{
                        borderRadius: 20,
                      }}
                    >
                      {o.status}
                    </Text>
                  </Flex>
                ))}
              </Box>
              <Box c="#374151" fz={13} mt={12}>
                Revenue:{' '}
                <strong
                  style={{
                    color: '#9333EA',
                  }}
                >
                  $
                  {orders
                    .filter((o) => o.status === 'completed')
                    .reduce((sum, o) => sum + o.amount, 0)
                    .toLocaleString()}
                </strong>
              </Box>
            </div>
          )}
          {dashTab === 'products' && canDo('products') && (
            <div>
              <Flex align="center" justify="space-between" wrap="wrap" mb={14}>
                <Title order={3} c="#1a0533" fz={18} ff="'Playfair Display',serif">
                  Products
                </Title>
                <Button
                  className="btn-h"
                  onClick={() => {
                    setShowDashboard(false);
                    openAdd();
                  }}
                  variant="filled"
                  color="brand"
                  px="lg"
                  type="button"
                >
                  + Add
                </Button>
              </Flex>
              <Box
                style={{
                  border: '1px solid #F3F4F6',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {products.map((p, i) => (
                  <Flex
                    key={p.id}
                    align="center"
                    gap={10}
                    wrap="wrap"
                    bg={i % 2 === 0 ? '#FAFAFA' : '#fff'}
                    p="10px 14px"
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <Box miw={100} flex={2}>
                      <Box c="#111827" fz={12} fw={600}>
                        {p.name}
                      </Box>
                    </Box>
                    <Text
                      component="span"
                      inherit
                      c="#9333EA"
                      fw={700}
                      ff="'Playfair Display',serif"
                    >
                      ${p.price}
                    </Text>
                    <Flex gap={6} wrap="wrap">
                      <Button
                        onClick={() => {
                          setShowDashboard(false);
                          openEdit(p);
                        }}
                        variant="light"
                        color="gray"
                        px="lg"
                        size="xs"
                        type="button"
                        fz={10}
                        p="4px 10px"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDashboard(false);
                          openDel(p.id);
                        }}
                        variant="light"
                        color="red"
                        px="lg"
                        size="xs"
                        type="button"
                        fz={10}
                        p="4px 8px"
                      >
                        Del
                      </Button>
                    </Flex>
                  </Flex>
                ))}
              </Box>
            </div>
          )}
          {dashTab === 'members' && canDo('members') && (
            <div>
              <Flex align="center" justify="space-between" wrap="wrap" mb={14}>
                <Title order={3} c="#1a0533" fz={18} ff="'Playfair Display',serif">
                  Team & Access
                </Title>
                <Button
                  className="btn-h"
                  onClick={() => setShowMemberForm(true)}
                  variant="filled"
                  color="brand"
                  px="lg"
                  type="button"
                >
                  + Add Member
                </Button>
              </Flex>
              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 3,
                }}
                spacing={10}
                mb={16}
              >
                {[
                  {
                    r: '👑 Owner',
                    p: 'longlife2024',
                    c: '#9333EA',
                    b: '#F3EEFF',
                  },
                  {
                    r: '🛠 Manager',
                    p: 'manager2024',
                    c: '#059669',
                    b: '#ECFDF5',
                  },
                  {
                    r: '🤝 VA',
                    p: 'va2024',
                    c: '#0EA5E9',
                    b: '#EFF6FF',
                  },
                ].map(({ r, p, c, b }) => (
                  <Box
                    key={r}
                    bg={b}
                    p="12px"
                    style={{
                      borderRadius: 10,
                      border: '1px solid',
                      borderColor: c + '33',
                    }}
                  >
                    <Box c={c} fz={13} fw={700} mb={3}>
                      {r}
                    </Box>
                    <Box c="#9CA3AF" fz={11}>
                      Password:{' '}
                      <strong
                        style={{
                          color: '#374151',
                        }}
                      >
                        {p}
                      </strong>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
              <Box
                mb={16}
                style={{
                  border: '1px solid #F3F4F6',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {teamMembers.map((m, i) => (
                  <Flex
                    key={m.id}
                    align="center"
                    gap={10}
                    wrap="wrap"
                    bg={i % 2 === 0 ? '#FAFAFA' : '#fff'}
                    p="10px 14px"
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <Box flex={1}>
                      <Box fz={12} fw={600}>
                        {m.name}
                      </Box>
                      <Box c="#9CA3AF" fz={10}>
                        {m.email}
                      </Box>
                    </Box>
                    <Text
                      component="span"
                      inherit
                      c={
                        m.role === 'owner'
                          ? '#9333EA'
                          : m.role === 'manager'
                            ? '#059669'
                            : '#0EA5E9'
                      }
                      bg={
                        m.role === 'owner'
                          ? '#F3EEFF'
                          : m.role === 'manager'
                            ? '#ECFDF5'
                            : '#EFF6FF'
                      }
                      fz={10}
                      p="2px 8px"
                      style={{
                        borderRadius: 20,
                      }}
                    >
                      {m.role === 'owner'
                        ? '👑 Owner'
                        : m.role === 'manager'
                          ? '🛠 Manager'
                          : '🤝 VA'}
                    </Text>
                    {m.role !== 'owner' && (
                      <Button
                        onClick={() => {
                          setMemberForm({
                            name: m.name,
                            email: m.email,
                            role: m.role,
                            password: '',
                          });
                          setEditMemberId(m.id);
                          setShowMemberForm(true);
                        }}
                        variant="light"
                        color="gray"
                        px="lg"
                        size="xs"
                        type="button"
                        fz={10}
                        p="4px 10px"
                      >
                        Edit
                      </Button>
                    )}
                    {m.role !== 'owner' && (
                      <Button
                        onClick={() => setTeamMembers((p) => p.filter((x) => x.id !== m.id))}
                        variant="light"
                        color="red"
                        px="lg"
                        size="xs"
                        type="button"
                        fz={10}
                        p="4px 8px"
                      >
                        Del
                      </Button>
                    )}
                  </Flex>
                ))}
              </Box>
              {showMemberForm && (
                <Box
                  bg="#F9FAFB"
                  p="20px"
                  style={{
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Title order={4} c="#1a0533" fz={15} fw={700} mb={12}>
                    {editMemberId ? 'Edit' : 'Add'} Team Member
                  </Title>
                  <SimpleGrid
                    cols={{
                      base: 1,
                      sm: 2,
                    }}
                    spacing={10}
                    mb={10}
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
                        Name *
                      </Box>
                      <Input
                        className="inp-f"
                        value={memberForm.name}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
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
                        value={memberForm.email}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
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
                    spacing={10}
                    mb={12}
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
                        Role
                      </Box>
                      <Input
                        className="inp-f"
                        value={memberForm.role}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            role: e.target.value,
                          })
                        }
                        component="select"
                      >
                        <option value="manager">🛠 Manager</option>
                        <option value="va">🤝 VA</option>
                      </Input>
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
                        Custom Password
                      </Box>
                      <Input
                        className="inp-f"
                        type="text"
                        placeholder={memberForm.role === 'manager' ? 'manager2024' : 'va2024'}
                        value={memberForm.password}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  </SimpleGrid>
                  <Flex gap={10} wrap="wrap">
                    <Button
                      className="btn-h"
                      onClick={() => {
                        if (!memberForm.name || !memberForm.email) {
                          fire('Fill all fields', 'err');
                          return;
                        }
                        if (editMemberId) {
                          setTeamMembers((p) =>
                            p.map((m) =>
                              m.id === editMemberId
                                ? {
                                    ...m,
                                    ...memberForm,
                                  }
                                : m,
                            ),
                          );
                          fire('Updated! ✦');
                          setEditMemberId(null);
                        } else {
                          setTeamMembers((p) => [
                            ...p,
                            {
                              id: Date.now(),
                              ...memberForm,
                              status: 'active',
                              added: new Date().toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              }),
                              lastLogin: 'Never',
                            },
                          ]);
                          fire('Member added! ✦');
                        }
                        setShowMemberForm(false);
                        setMemberForm({
                          name: '',
                          email: '',
                          role: 'va',
                          password: '',
                        });
                      }}
                      variant="filled"
                      color="brand"
                      px="lg"
                      type="button"
                      flex={1}
                    >
                      {editMemberId ? 'Save' : 'Add Member'}
                    </Button>
                    <Button
                      className="btn-h"
                      onClick={() => {
                        setShowMemberForm(false);
                        setEditMemberId(null);
                      }}
                      variant="light"
                      color="red"
                      px="lg"
                      type="button"
                    >
                      Cancel
                    </Button>
                  </Flex>
                </Box>
              )}
            </div>
          )}
          {dashTab === 'subs' && canDo('subscribers') && (
            <div>
              <Title order={3} c="#1a0533" fz={18} ff="'Playfair Display',serif" mb={14}>
                Email Subscribers ({subscribers.length})
              </Title>
              {subscribers.length === 0 ? (
                <Box
                  bg="#F9FAFB"
                  ta="center"
                  p="30px"
                  style={{
                    borderRadius: 10,
                    border: '1px dashed #E5E7EB',
                  }}
                >
                  <Box fz={32} mb={8}>
                    ✉️
                  </Box>
                  <Text component="p" inherit c="#9CA3AF">
                    No subscribers yet
                  </Text>
                </Box>
              ) : (
                subscribers.map((sub, i) => (
                  <Flex
                    key={i}
                    gap={10}
                    wrap="wrap"
                    bg={i % 2 === 0 ? '#FAFAFA' : '#fff'}
                    fz={12}
                    p="8px 14px"
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <Text component="span" inherit fw={600} flex={1}>
                      {sub.name}
                    </Text>
                    <Text component="span" inherit c="#9333EA" flex={2}>
                      {sub.email}
                    </Text>
                    <Text component="span" inherit c="#9CA3AF">
                      {sub.date}
                    </Text>
                  </Flex>
                ))
              )}
            </div>
          )}
          {dashTab === 'store' && canDo('store') && (
            <div>
              <Title order={3} c="#1a0533" fz={18} ff="'Playfair Display',serif" mb={14}>
                Store Settings
              </Title>
              <SimpleGrid
                cols={{
                  base: 1,
                  sm: 2,
                }}
                spacing={14}
              >
                <Box
                  bg="#F9FAFB"
                  mb={12}
                  p="16px"
                  style={{
                    border: '1px solid #F3F4F6',
                    borderRadius: 10,
                  }}
                >
                  <Box c="#111827" fz={13} fw="700" mb={12}>
                    🏪 Store Info
                  </Box>
                  {[
                    ['Store Name', 'Longlife Digital'],
                    ['URL', 'longlifedigital.co'],
                    ['Email', 'support@lldhome.com'],
                  ].map(([l, v]) => (
                    <div key={l}>
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
                        {l}
                      </Box>
                      <Input className="inp-f" defaultValue={v} />
                    </div>
                  ))}
                  <Button
                    className="btn-h"
                    onClick={() => fire('Saved! ✦')}
                    variant="filled"
                    color="brand"
                    px="lg"
                    type="button"
                    w="100%"
                    mt={10}
                  >
                    Save
                  </Button>
                </Box>
                <Box
                  bg="#F9FAFB"
                  mb={12}
                  p="16px"
                  style={{
                    border: '1px solid #F3F4F6',
                    borderRadius: 10,
                  }}
                >
                  <Box c="#111827" fz={13} fw="700" mb={12}>
                    🔐 Passwords
                  </Box>
                  {[
                    ['👑 Owner', 'longlife2024'],
                    ['🛠 Manager', 'manager2024'],
                    ['🤝 VA', 'va2024'],
                  ].map(([l, v]) => (
                    <div key={l}>
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
                        {l}
                      </Box>
                      <Input className="inp-f" defaultValue={v} />
                    </div>
                  ))}
                  <Button
                    className="btn-h"
                    onClick={() => fire('Updated! ✦')}
                    variant="filled"
                    color="brand"
                    px="lg"
                    type="button"
                    w="100%"
                    mt={10}
                  >
                    Update
                  </Button>
                </Box>
              </SimpleGrid>
            </div>
          )}
        </Box>
      </Flex>
    </ResponsiveModal>
  );
}
