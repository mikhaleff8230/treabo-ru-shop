import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Camera, CheckCheck, Loader2, Mic, MoreHorizontal, Phone, Plus, Search, Send } from 'lucide-react';
import Pusher from 'pusher-js';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  fetchTreaboChatMessages,
  fetchTreaboChats,
  markTreaboChatRead,
  sendTreaboChatMessage,
  sendTreaboChatTyping,
  sendTreaboPresenceHeartbeat,
  type TreaboChat,
  type TreaboMessage,
} from '@/data/treabo';
import { useTreaboAuth } from '@/hooks/use-treabo-auth';

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('treabo_token');
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function lastSeenText(value?: string | null) {
  if (!value) return 'был недавно';
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 5 * 60 * 1000) return 'в сети';
  if (diff < 60 * 60 * 1000) return `был ${Math.max(1, Math.floor(diff / 60000))} мин назад`;
  return 'был недавно';
}

function getBroadcastAuthEndpoint() {
  if (process.env.NEXT_PUBLIC_TREABO_BROADCAST_AUTH_ENDPOINT) {
    return process.env.NEXT_PUBLIC_TREABO_BROADCAST_AUTH_ENDPOINT;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('treabo.ru')) {
    return 'https://api.treabo.ru/api/broadcasting/auth';
  }
  return 'http://127.0.0.1:8001/api/broadcasting/auth';
}

function getPusherOptions(token: string) {
  const scheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME || 'https';
  const port = Number(process.env.NEXT_PUBLIC_PUSHER_PORT || (scheme === 'https' ? 443 : 6001));
  const forceTLS = scheme === 'https' || port === 443;

  return {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || 'api.treabo.ru',
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: forceTLS ? ['wss'] : ['ws', 'wss'],
    authEndpoint: getBroadcastAuthEndpoint(),
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  };
}

export default function TreaboChatsPage() {
  const router = useRouter();
  const auth = useTreaboAuth();
  const [chats, setChats] = useState<TreaboChat[]>([]);
  const [messages, setMessages] = useState<TreaboMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedChat = chats.find((chat) => String(chat.id) === String(selectedId)) || null;
  const chatOpen = Boolean(selectedId);

  const filteredChats = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) =>
      [chat.task_title, chat.customer_name, chat.specialist_name, chat.last_message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [chats, query]);

  const otherName = selectedChat
    ? auth.isSpecialist
      ? selectedChat.customer_name
      : selectedChat.specialist_name
    : '';
  const status = selectedChat?.other_is_online ? 'в сети' : lastSeenText(selectedChat?.other_last_seen_at);

  async function loadChats(keepSelection = true) {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setError('Войдите как специалист или клиент, чтобы увидеть чаты.');
      return;
    }

    try {
      const next = await fetchTreaboChats(token);
      setChats(next);
      const urlId = typeof router.query.id === 'string' ? router.query.id : null;
      setSelectedId(keepSelection ? urlId || selectedId : urlId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить чаты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!router.isReady) return;
    const urlId = typeof router.query.id === 'string' ? router.query.id : null;
    setSelectedId(urlId);
    loadChats(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.id]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    sendTreaboPresenceHeartbeat(token).catch(() => undefined);
    const timer = setInterval(() => sendTreaboPresenceHeartbeat(token).catch(() => undefined), 45000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || !selectedId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    setError(null);
    fetchTreaboChatMessages(selectedId, token)
      .then((next) => {
        setMessages(next);
        return markTreaboChatRead(selectedId, token).catch(() => undefined);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить сообщения'))
      .finally(() => setMessagesLoading(false));
  }, [selectedId]);

  useEffect(() => {
    const token = getToken();
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    if (!token || !key || !selectedId) return undefined;

    const pusher = new Pusher(key, getPusherOptions(token));
    const channel = pusher.subscribe(`private-proffi.chat.${selectedId}`);

    channel.bind('message.sent', (event: { message?: TreaboMessage; chat?: Partial<TreaboChat> }) => {
      const message = event?.message;
      if (!message) return;
      setMessages((current) => {
        if (current.some((item) => String(item.id) === String(message.id))) return current;
        return [...current, message];
      });
      setChats((current) =>
        current.map((chat) =>
          String(chat.id) === String(selectedId)
            ? { ...chat, ...(event.chat || {}), last_message: message.text, last_message_at: message.created_at }
            : chat,
        ),
      );
      if (String(message.sender_id) !== String(auth.user?.id)) {
        markTreaboChatRead(selectedId, token).catch(() => undefined);
      }
    });

    channel.bind('messages.read', (event: { reader_id?: string; read_at?: string }) => {
      if (String(event?.reader_id) === String(auth.user?.id)) return;
      setMessages((current) =>
        current.map((message) =>
          String(message.sender_id) === String(auth.user?.id) ? { ...message, read_at: event.read_at } : message,
        ),
      );
    });

    channel.bind('user.typing', (event: { user_id?: string; is_typing?: boolean }) => {
      if (String(event?.user_id) === String(auth.user?.id)) return;
      setTyping(Boolean(event?.is_typing));
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 5500);
    });

    channel.bind('presence.updated', (event: { user_id?: string; is_online?: boolean; last_seen_at?: string }) => {
      if (String(event?.user_id) === String(auth.user?.id)) return;
      setChats((current) =>
        current.map((chat) =>
          String(chat.id) === String(selectedId)
            ? { ...chat, other_is_online: Boolean(event?.is_online), other_last_seen_at: event?.last_seen_at }
            : chat,
        ),
      );
    });

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      pusher.unsubscribe(`private-proffi.chat.${selectedId}`);
      pusher.disconnect();
    };
  }, [auth.user?.id, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function openChat(chatId: string) {
    setSelectedId(chatId);
    router.push(`/treabo/chats?id=${chatId}`, undefined, { shallow: true });
  }

  function backToList() {
    setSelectedId(null);
    setMessages([]);
    router.push('/treabo/chats', undefined, { shallow: true });
  }

  function onTextChange(value: string) {
    setText(value);
    const token = getToken();
    if (!token || !selectedId) return;
    sendTreaboChatTyping(selectedId, token, value.trim().length > 0).catch(() => undefined);
    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      sendTreaboChatTyping(selectedId, token, false).catch(() => undefined);
    }, 2500);
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    const body = text.trim();
    if (!token) {
      setError('Войдите, чтобы отправить сообщение.');
      return;
    }
    if (!selectedId || !body || sending) return;

    setSending(true);
    setText('');
    setError(null);
    try {
      const message = await sendTreaboChatMessage(selectedId, token, body);
      setMessages((current) => (current.some((item) => String(item.id) === String(message.id)) ? current : [...current, message]));
      setChats((current) =>
        current.map((chat) =>
          String(chat.id) === String(selectedId)
            ? { ...chat, last_message: body, last_message_at: message.created_at || new Date().toISOString() }
            : chat,
        ),
      );
      sendTreaboChatTyping(selectedId, token, false).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
      setText(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <TreaboAccountShell title="Чаты">
      {!chatOpen ? (
        <section className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-4xl font-black tracking-tight">Сообщения</h1>
            <div className="hidden rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#7d849b] shadow-sm sm:block">
              {chats.length ? `${chats.length} диалогов` : 'Treabo'}
            </div>
          </div>

          <div className="mb-3 rounded-[28px] bg-white p-4 shadow-sm">
            <div className="flex rounded-2xl bg-[#f5f6f1] px-4 py-3">
              <Search className="mr-2 h-5 w-5 text-[#7d849b]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по сообщениям"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#7d849b]"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : null}
            {!loading && filteredChats.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-xl font-black">Чатов пока нет</div>
                <p className="mt-2 text-sm font-semibold text-[#7d849b]">{error || 'Сообщения появятся после отклика или принятия заказа.'}</p>
              </div>
            ) : null}
            {filteredChats.map((chat) => {
              const name = auth.isSpecialist ? chat.customer_name : chat.specialist_name;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-[#f7f8f4]"
                >
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d9f36b] text-lg font-black">
                    {(name || chat.task_title || 'T').charAt(0).toUpperCase()}
                    {chat.other_is_online ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-base font-black">{name || 'Клиент Treabo'}</span>
                      <span className="shrink-0 text-xs font-bold text-[#7d849b]">{formatDate(chat.last_message_at || chat.updated_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-bold">{chat.task_title}</span>
                    <span className="mt-1 flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-[#7d849b]">
                        {chat.is_typing ? 'печатает...' : chat.last_message || 'Чат создан. Напишите первое сообщение.'}
                      </span>
                      {chat.unread_count ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff405c] px-1.5 text-xs font-black text-white">
                          {chat.unread_count > 9 ? '9+' : chat.unread_count}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mx-auto flex min-h-[720px] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-sm">
          <header className="flex h-20 items-center gap-3 border-b border-zinc-100 px-4 sm:px-6">
            <button onClick={backToList} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#f5f6f1]">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9f36b] text-lg font-black">
              {(otherName || selectedChat?.task_title || 'T').charAt(0).toUpperCase()}
              {selectedChat?.other_is_online ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black">{otherName || selectedChat?.task_title || 'Чат Treabo'}</div>
              <div className="truncate text-sm font-semibold text-[#7d849b]">
                {typing ? 'печатает...' : `${status}${selectedChat?.task_title ? ` · ${selectedChat.task_title}` : ''}`}
              </div>
            </div>
            <button className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-[#f5f6f1] sm:flex"><Phone className="h-5 w-5" /></button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#f5f6f1]"><MoreHorizontal className="h-6 w-6" /></button>
          </header>

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">{error}</div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-5 sm:px-8">
            {messagesLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : null}
            {!messagesLoading && messages.length === 0 ? (
              <div className="mx-auto mt-20 max-w-sm text-center">
                <div className="text-xl font-black">Сообщений пока нет</div>
                <p className="mt-2 text-sm font-semibold text-[#7d849b]">Напишите первое сообщение по заказу.</p>
              </div>
            ) : null}
            {messages.map((message) => {
              const isOwn = String(message.sender_id) === String(auth.user?.id);
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-[22px] px-4 py-3 text-[15px] font-semibold leading-snug shadow-sm sm:max-w-[66%] ${
                    isOwn ? 'rounded-br-md bg-[#e4f5ff] text-[#111]' : 'rounded-bl-md bg-[#f1f1ef] text-[#111]'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">{message.text}</div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#7d849b]">
                      {isOwn ? <CheckCheck className="h-3 w-3 text-sky-500" /> : null}
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            {typing ? (
              <div className="flex justify-start">
                <div className="rounded-[22px] bg-[#f1f1ef] px-4 py-2 text-sm font-bold text-[#7d849b]">печатает...</div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={submitMessage} className="flex items-center gap-2 border-t border-zinc-100 bg-white px-4 py-3 sm:px-6">
            <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#f5f6f1]"><Plus className="h-6 w-6" /></button>
            <input
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              placeholder="Сообщение"
              className="min-h-[46px] flex-1 rounded-2xl border-2 border-sky-200 bg-white px-4 font-semibold outline-none focus:border-sky-400"
            />
            <button type="button" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#f5f6f1] sm:flex"><Camera className="h-5 w-5" /></button>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                text.trim() && !sending ? 'bg-[#232323] text-white hover:bg-black' : 'text-[#7d849b] hover:bg-[#f5f6f1]'
              }`}
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : text.trim() ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </form>
        </section>
      )}
    </TreaboAccountShell>
  );
}
