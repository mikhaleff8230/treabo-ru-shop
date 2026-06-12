import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCheck, Loader2, Send, Search } from 'lucide-react';
import TreaboAccountShell from '@/components/treabo/TreaboAccountShell';
import {
  fetchTreaboChatMessages,
  fetchTreaboChats,
  sendTreaboChatMessage,
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
  const [error, setError] = useState<string | null>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedId) || null;
  const filteredChats = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) =>
      [chat.task_title, chat.customer_name, chat.specialist_name, chat.last_message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [chats, query]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setError('Войдите как специалист или клиент, чтобы увидеть чаты.');
      return;
    }

    fetchTreaboChats(token)
      .then((next) => {
        setChats(next);
        const urlId = typeof router.query.id === 'string' ? router.query.id : null;
        setSelectedId(urlId || next[0]?.id || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить чаты'))
      .finally(() => setLoading(false));
  }, [router.query.id]);

  useEffect(() => {
    const token = getToken();
    if (!token || !selectedId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    fetchTreaboChatMessages(selectedId, token)
      .then(setMessages)
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить сообщения'))
      .finally(() => setMessagesLoading(false));
  }, [selectedId]);

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    const body = text.trim();
    if (!token || !selectedId || !body) return;

    setText('');
    try {
      const message = await sendTreaboChatMessage(selectedId, token, body);
      setMessages((current) => [...current, message]);
      setChats((current) =>
        current.map((chat) =>
          chat.id === selectedId
            ? { ...chat, last_message: body, last_message_at: new Date().toISOString() }
            : chat,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
      setText(body);
    }
  }

  return (
    <TreaboAccountShell title="Чаты">
      <div className="grid min-h-[680px] overflow-hidden rounded-[30px] bg-white shadow-sm lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-100 lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-100 p-4">
            <div className="flex rounded-2xl bg-[#f5f6f1] px-3 py-2">
              <Search className="mr-2 h-5 w-5 text-[#7d849b]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Какой чат ищете?"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#7d849b]"
              />
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : null}
            {!loading && filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-lg font-black">Чатов пока нет</div>
                <p className="mt-2 text-sm font-semibold text-[#7d849b]">Сообщения появятся после отклика или принятия заказа.</p>
              </div>
            ) : null}
            {filteredChats.map((chat) => {
              const active = chat.id === selectedId;
              const name = auth.isSpecialist ? chat.customer_name : chat.specialist_name;
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedId(chat.id);
                    router.push(`/treabo/chats?id=${chat.id}`, undefined, { shallow: true });
                  }}
                  className={`flex w-full gap-3 border-b border-zinc-100 px-4 py-4 text-left transition ${
                    active ? 'bg-[#f5f6f1]' : 'hover:bg-[#fafbf7]'
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9f36b] text-lg font-black">
                    {(name || chat.task_title || 'T').charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-black">{name || 'Клиент Treabo'}</span>
                      <span className="shrink-0 text-xs font-bold text-[#7d849b]">{formatDate(chat.last_message_at || chat.updated_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-bold">{chat.task_title}</span>
                    <span className="mt-1 block truncate text-sm text-[#7d849b]">
                      {chat.last_message || 'Чат создан. Напишите первое сообщение.'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col">
          {selectedChat ? (
            <>
              <div className="border-b border-zinc-100 px-5 py-4">
                <div className="text-lg font-black">{selectedChat.task_title || 'Чат Treabo'}</div>
                <div className="text-sm font-semibold text-[#7d849b]">
                  {auth.isSpecialist ? selectedChat.customer_name : selectedChat.specialist_name}
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f6f1] p-4">
                {messagesLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : null}
                {messages.map((message) => {
                  const isOwn = String(message.sender_id) === String(auth.user?.id);
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm font-semibold shadow-sm ${
                        isOwn ? 'bg-[#232323] text-white' : 'bg-white text-[#232323]'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.text}</div>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isOwn ? 'text-white/65' : 'text-[#7d849b]'}`}>
                          {message.created_at ? new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                          {isOwn ? <CheckCheck className="h-3 w-3" /> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={submitMessage} className="flex gap-2 border-t border-zinc-100 bg-white p-4">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Сообщение"
                  className="min-h-[52px] flex-1 rounded-2xl bg-[#f5f6f1] px-4 font-semibold outline-none"
                />
                <button className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#d9f36b]">
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <div className="text-xl font-black">Выберите чат</div>
                <p className="mt-2 max-w-sm text-sm font-semibold text-[#7d849b]">
                  {error || 'Откройте диалог из списка, чтобы написать клиенту или специалисту.'}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </TreaboAccountShell>
  );
}
