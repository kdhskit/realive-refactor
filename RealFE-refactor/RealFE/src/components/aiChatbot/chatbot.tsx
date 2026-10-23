// chatbot.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

export default function ChatBotWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<
        { sender: 'user' | 'bot'; text: string }[]
    >([]);
    const [token, setToken] = useState<string | null>(null);

    const pathname = usePathname();

    // ✅ 토큰 가져오기
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const raw =
                localStorage.getItem('seller-auth-storage') ||
                localStorage.getItem('auth-storage');
            const parsed = raw ? JSON.parse(raw) : null;
            const storedToken = parsed?.state?.accessToken;
            setToken(storedToken || null);
        }
    }, []);

    // ✅ 이전 대화 불러오기
    useEffect(() => {
        const stored = sessionStorage.getItem('chat-history');
        if (stored) {
            setMessages(JSON.parse(stored));
        }
    }, []);

    // ✅ 대화 저장
    useEffect(() => {
        sessionStorage.setItem('chat-history', JSON.stringify(messages));
    }, [messages]);

    // ✅ 챗봇 열렸을 때 인삿말 자동 추가
    useEffect(() => {
        if (open) {
            const hasGreeted = messages.some(
                (m) => m.sender === 'bot' && m.text.includes('상품 추천')
            );
            if (!hasGreeted) {
                const greeting = {
                    sender: 'bot' as const,
                    text: `안녕하세요! 😊<br />상품 추천, 상품 조회, 기타 문의 등을 도와드릴 수 있어요.`,
                };
                setMessages((prev) => [...prev, greeting]);
            }
        }
    }, [open]);

    // 숨길 경로
    const hiddenPaths = [
        '/login',
        '/admin',
        '/customer/signup',
        '/customer/member/login',
        '/customer/cart',
        '/seller/login',
    ];
    const shouldHide = hiddenPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
    if (shouldHide) return null;

    // ✅ GPT 메시지 포맷 변환
    const convertMessagesForGPT = (
        msgs: { sender: 'user' | 'bot'; text: string }[]
    ) => {
        return msgs.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text.replace(/<br\s*\/?>/g, '\n'),
        }));
    };

    // ✅ 메시지 전송
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || !token) return;

        const userMsg = { sender: 'user' as const, text: trimmed };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');

        try {
            // 🔁 이전 대화 포함하여 GPT에 전달
            const formattedMessages = convertMessagesForGPT(newMessages);

            console.log('[디버깅] formattedMessages:', formattedMessages);

            const res = await axios.post(
                'http://localhost:8080/api/chat',
                { message: trimmed },
                {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                }
            );

            const botMsg = {
                sender: 'bot' as const,
                text: res.data.reply || '❌ 답변을 받을 수 없습니다.',
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err.message || '알 수 없는 오류';
            setMessages((prev) => [
                ...prev,
                { sender: 'bot', text: `❌ 오류 발생: ${errorMessage}` },
            ]);
            console.error('[GPT 오류]', err);
        }

    };

    return (
        <div>
            {/* 🟢 챗봇 열기 버튼 */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-4 right-4 bg-black text-white rounded-full w-14 h-14 shadow-lg z-50 flex items-center justify-center"
            >
                <HiOutlineChatBubbleLeftRight size={24} />
            </button>

            {/* 🟢 챗봇 패널 */}
            {open && (
                <div className="fixed bottom-20 right-4 w-80 h-96 bg-white shadow-lg rounded-xl border border-gray-300 z-50 flex flex-col">

                    {/* 🟣 상단 헤더 */}
                    <div className="bg-black text-white px-4 py-2 rounded-t-xl flex justify-between items-center">
                        <HiOutlineChatBubbleLeftRight size={24} className="text-white" />
                        <button onClick={() => setOpen(false)} className="text-white text-xl">
                            ⨉
                        </button>
                    </div>

                    {/* 🟣 메시지 영역 */}
                    <div className="flex-1 overflow-y-auto mb-2 space-y-2 p-4 pr-1">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`inline-block px-3 py-2 rounded-lg text-sm break-words ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-gray-200 text-black rounded-bl-none'
                                    }`}
                                    style={{ maxWidth: '80%' }}
                                    dangerouslySetInnerHTML={{
                                        __html: msg.text.replace(/\n/g, '<br />'),
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* 🟣 입력창 */}
                    <form
                        onSubmit={sendMessage}
                        className="px-4 pb-4 mt-auto flex gap-2 items-center relative"
                    >
                        <input
                            type="text"
                            placeholder={token ? '메시지를 입력하세요' : '로그인 후 이용해주세요'}
                            className="flex-1 border border-gray-300 px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            readOnly={!token}
                            style={
                                !token ? { pointerEvents: 'none', userSelect: 'none' } : undefined
                            }
                        />
                        {input.trim() && token && (
                            <button
                                type="submit"
                                className="absolute right-6 p-2 bg-blue-500 text-white rounded-full transition hover:bg-blue-600 active:scale-95"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}
