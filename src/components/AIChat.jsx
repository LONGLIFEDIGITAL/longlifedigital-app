import { ActionIcon, Box, Flex, Input, Text } from '@mantine/core';
import { useState, useRef, useEffect } from 'react';
export default function AIChat({ settings }) {
  const chat = settings.chat || {};
  const welcome = chat.welcome || 'How can we help?';
  const unavailable =
    chat.unavailableMessage || 'Chat is temporarily unavailable. Please try again later.';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    if (open)
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
  }, [messages, open]);
  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = {
      role: 'user',
      content: text,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const apiMessages = next;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || unavailable,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: unavailable,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      {/* Floating button */}
      <ActionIcon
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Live Chat with AI Assistant"
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        variant="transparent"
        color="dark"
        px={0}
        type="button"
        c="#fff"
        bg="linear-gradient(135deg, #7C3AED, #9333EA)"
        fz={26}
        w={60}
        h={60}
        pos="fixed"
        right={16}
        bottom="max(16px, env(safe-area-inset-bottom))"
        style={{
          zIndex: 180,
          border: 'none',
          borderRadius: 50,
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(147,51,234,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
      >
        {open ? '✕' : '🤖'}
      </ActionIcon>

      {/* Chat window */}
      {open && (
        <Flex
          direction="column"
          wrap="nowrap"
          bg="linear-gradient(160deg, #0a001e, #1a0533)"
          w="min(360px, calc(100vw - 32px))"
          h="min(500px, calc(100dvh - 116px - env(safe-area-inset-bottom)))"
          pos="fixed"
          right={16}
          bottom="calc(84px + env(safe-area-inset-bottom))"
          style={{
            zIndex: 179,
            border: '1px solid rgba(147,51,234,0.4)',
            borderRadius: 20,
            boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(147,51,234,0.2)',
            overflow: 'hidden',
            animation: 'chatSlideIn 0.25s ease',
          }}
        >
          {/* Header */}
          <Flex
            align="center"
            gap={10}
            wrap="wrap"
            bg="linear-gradient(135deg, rgba(124,58,237,0.3), rgba(147,51,234,0.2))"
            p="14px 18px"
            style={{
              borderBottom: '1px solid rgba(147,51,234,0.3)',
            }}
          >
            <Flex
              align="center"
              justify="center"
              wrap="wrap"
              bg="linear-gradient(135deg,#7C3AED,#9333EA)"
              fz={18}
              w={38}
              h={38}
              style={{
                borderRadius: '50%',
                flexShrink: 0,
              }}
            >
              🤖
            </Flex>
            <div>
              <Box c="#E8C97A" fz={14} fw={700} lh={1.2}>
                {chat.displayName || 'AI Assistant'}
              </Box>
              <Box c="#A78BFA" fz={11}>
                {settings.brand.name}
              </Box>
            </div>
            <Flex align="center" gap={5} wrap="wrap" ml="auto">
              <Box
                bg="#22C55E"
                w={8}
                h={8}
                style={{
                  borderRadius: '50%',
                  boxShadow: '0 0 6px #22C55E',
                }}
              />
              <Text component="span" inherit c="#A78BFA" fz={11}>
                Live
              </Text>
            </Flex>
          </Flex>

          {/* Messages */}
          <Flex
            direction="column"
            gap={10}
            wrap="nowrap"
            p="14px 14px 6px"
            flex={1}
            style={{
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {[{ role: 'assistant', content: welcome }, ...messages].map((m, i) => (
              <Flex key={i} justify={m.role === 'user' ? 'flex-end' : 'flex-start'} wrap="wrap">
                <Box
                  c={m.role === 'user' ? '#fff' : '#E2D9F3'}
                  bg={
                    m.role === 'user'
                      ? 'linear-gradient(135deg,#7C3AED,#9333EA)'
                      : 'rgba(255,255,255,0.07)'
                  }
                  fz={13}
                  lh={1.5}
                  maw="82%"
                  p="9px 13px"
                  style={{
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    border: m.role === 'user' ? 'none' : '1px solid rgba(147,51,234,0.2)',
                  }}
                >
                  {m.content}
                </Box>
              </Flex>
            ))}
            {loading && (
              <Flex justify="flex-start" wrap="wrap">
                <Box
                  c="#A78BFA"
                  bg="rgba(255,255,255,0.07)"
                  fz={20}
                  lts={2}
                  p="9px 16px"
                  style={{
                    border: '1px solid rgba(147,51,234,0.2)',
                    borderRadius: '14px 14px 14px 4px',
                  }}
                >
                  <Text
                    component="span"
                    inherit
                    style={{
                      animation: 'dot 1.2s infinite',
                    }}
                  >
                    •
                  </Text>
                  <Text
                    component="span"
                    inherit
                    style={{
                      animation: 'dot 1.2s 0.4s infinite',
                    }}
                  >
                    •
                  </Text>
                  <Text
                    component="span"
                    inherit
                    style={{
                      animation: 'dot 1.2s 0.8s infinite',
                    }}
                  >
                    •
                  </Text>
                </Box>
              </Flex>
            )}
            {!messages.length &&
              (chat.suggestedQuestions || []).map((question) => (
                <button key={question} type="button" onClick={() => setInput(question)}>
                  {question}
                </button>
              ))}
            <div ref={bottomRef} />
          </Flex>

          {/* Input */}
          <Flex
            align="center"
            gap={8}
            wrap="wrap"
            p="10px 12px"
            style={{
              borderTop: '1px solid rgba(147,51,234,0.2)',
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about our services..."
              styles={{
                input: {
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(147,51,234,0.3)',
                  borderRadius: 10,
                  color: '#fff',
                  padding: '9px 12px',
                },
              }}
            />
            <ActionIcon
              onClick={send}
              disabled={loading || !input.trim()}
              variant="transparent"
              color="dark"
              px={0}
              type="button"
              c="#fff"
              bg={
                loading || !input.trim()
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg,#7C3AED,#9333EA)'
              }
              fz={16}
              w={38}
              h={38}
              style={{
                border: 'none',
                borderRadius: 10,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              ➤
            </ActionIcon>
          </Flex>
        </Flex>
      )}

      <style>{`
        @keyframes chatSlideIn { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes dot { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
      `}</style>
    </>
  );
}
