import ResponsiveModal from './ResponsiveModal';
import { ActionIcon, Box, Button, Input, Text, Title } from '@mantine/core';
import LDLogo from './LDLogo';
export default function LoginModal({
  showLogin,
  setShowLogin,
  loginPass,
  setLoginPass,
  loginErr,
  setLoginErr,
  login,
}) {
  if (!showLogin) return null;
  return (
    <ResponsiveModal
      onClose={() => {
        setShowLogin(false);
        setLoginPass('');
        setLoginErr(false);
      }}
      size={360}
      zIndex={200}
      label="Admin login"
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        p={{
          base: 20,
          sm: 32,
        }}
        bg="#fff"
        ta="center"
        pos="relative"
        style={{
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        }}
      >
        <ActionIcon
          onClick={() => {
            setShowLogin(false);
            setLoginPass('');
            setLoginErr(false);
          }}
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
        <LDLogo size={48} />
        <Title order={2} c="#111827" fz={20} fw="700" ff="'Playfair Display',serif" mt={14} mb={6}>
          Admin Login
        </Title>
        <Text component="p" inherit c="#9CA3AF" fz={13} mb={20}>
          Enter your password to manage products
        </Text>
        <Input
          className="inp-f"
          type="password"
          placeholder="Password"
          value={loginPass}
          onChange={(e) => {
            setLoginPass(e.target.value);
            setLoginErr(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && login()}
          autoFocus
          styles={{
            input: {
              textAlign: 'center',
              letterSpacing: 4,
              borderColor: loginErr ? '#EF4444' : '#E5E7EB',
            },
          }}
        />
        {loginErr && (
          <Text component="p" inherit c="#EF4444" fz={12} mt={8}>
            Incorrect password.
          </Text>
        )}
        <Button
          className="btn-h"
          onClick={login}
          variant="filled"
          color="brand"
          px="lg"
          type="button"
          w="100%"
          mt={14}
          p="12px"
        >
          Login
        </Button>
      </Box>
    </ResponsiveModal>
  );
}
