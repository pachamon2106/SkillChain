"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";

import {
  useWallet,
} from "@/components/wallet/WalletProvider";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type CurrentUser = {
  id: number;
  name: string | null;
  email: string;
};

type ChatUser = {
  id: number;
  name: string | null;
  email: string;
};

type LastMessage = {
  id: number;
  senderId: number;
  content: string;
  readAt: string | null;
  createdAt: string;
};

type ConversationItem = {
  id: number;

  otherUser:
    ChatUser;

  lastMessage:
    LastMessage | null;

  unreadCount:
    number;

  createdAt:
    string;

  updatedAt:
    string;
};

type ChatMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  readAt: string | null;
  createdAt: string;

  sender: {
    id: number;
    name: string | null;
    email: string;
  };
};

type ConversationDetail = {
  id: number;

  otherUser:
    ChatUser;

  unreadCount:
    number;

  createdAt:
    string;

  updatedAt:
    string;
};

type SearchUser = {
  id: number;
  name: string | null;
  email: string;

  conversationId:
    number | null;
};

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default function MessagesPage() {
  const router =
    useRouter();

  const {
    resetWallet,
  } = useWallet();

  /*
   * =========================================================
   * USER
   * =========================================================
   */

  const [
    user,
    setUser,
  ] =
    useState<CurrentUser | null>(
      null
    );

  /*
   * =========================================================
   * CONVERSATIONS
   * =========================================================
   */

  const [
    conversations,
    setConversations,
  ] =
    useState<ConversationItem[]>(
      []
    );

  const [
    conversationsLoading,
    setConversationsLoading,
  ] =
    useState(true);

  const [
    conversationsError,
    setConversationsError,
  ] =
    useState("");

  const [
    totalUnread,
    setTotalUnread,
  ] =
    useState(0);

  /*
   * =========================================================
   * ACTIVE CHAT
   * =========================================================
   */

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] =
    useState<number | null>(
      null
    );

  const [
    activeConversation,
    setActiveConversation,
  ] =
    useState<ConversationDetail | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<ChatMessage[]>(
      []
    );

  const [
    chatLoading,
    setChatLoading,
  ] =
    useState(false);

  const [
    chatError,
    setChatError,
  ] =
    useState("");

  /*
   * =========================================================
   * SEND MESSAGE
   * =========================================================
   */

  const [
    messageInput,
    setMessageInput,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  /*
   * =========================================================
   * NEW CHAT
   * =========================================================
   */

  const [
    newChatOpen,
    setNewChatOpen,
  ] =
    useState(false);

  const [
    userSearch,
    setUserSearch,
  ] =
    useState("");

  const [
    searchUsers,
    setSearchUsers,
  ] =
    useState<SearchUser[]>(
      []
    );

  const [
    searchLoading,
    setSearchLoading,
  ] =
    useState(false);

  const [
    openingUserId,
    setOpeningUserId,
  ] =
    useState<number | null>(
      null
    );

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  const [
    openProfile,
    setOpenProfile,
  ] =
    useState(false);

  /*
   * =========================================================
   * SCROLL
   * =========================================================
   */

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const previousMessageCountRef =
    useRef(
      0
    );

  /*
   * =========================================================
   * LOAD PROFILE
   * =========================================================
   */

  const loadProfile =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/profile",
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            response.status ===
            401
          ) {
            router.push(
              "/"
            );

            return;
          }

          if (
            !response.ok ||
            !data?.success
          ) {
            setUser(
              null
            );

            return;
          }

          setUser(
            data.user
          );
        } catch (error) {
          console.error(
            "Load profile error:",
            error
          );

          setUser(
            null
          );
        }
      },
      [
        router,
      ]
    );

  /*
   * =========================================================
   * LOAD CONVERSATIONS
   * =========================================================
   */

  const loadConversations =
    useCallback(
      async (
        showLoading = true
      ) => {
        try {
          if (
            showLoading
          ) {
            setConversationsLoading(
              true
            );
          }

          setConversationsError(
            ""
          );

          const response =
            await fetch(
              "/api/messages",
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            response.status ===
            401
          ) {
            router.push(
              "/"
            );

            return;
          }

          if (
            !response.ok ||
            !data?.success
          ) {
            setConversations(
              []
            );

            setTotalUnread(
              0
            );

            setConversationsError(
              data?.message ||
                "ไม่สามารถโหลดรายการสนทนาได้"
            );

            return;
          }

          setConversations(
            Array.isArray(
              data.conversations
            )
              ? data.conversations
              : []
          );

          setTotalUnread(
            typeof data.totalUnread ===
              "number"
              ? data.totalUnread
              : 0
          );
        } catch (error) {
          console.error(
            "Load conversations error:",
            error
          );

          setConversationsError(
            "ไม่สามารถเชื่อมต่อเพื่อโหลดข้อความได้"
          );
        } finally {
          if (
            showLoading
          ) {
            setConversationsLoading(
              false
            );
          }
        }
      },
      [
        router,
      ]
    );

  /*
   * =========================================================
   * MARK AS READ
   * =========================================================
   */

  const markConversationAsRead =
    useCallback(
      async (
        conversationId: number
      ) => {
        try {
          const response =
            await fetch(
              "/api/messages",
              {
                method:
                  "PATCH",

                credentials:
                  "include",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    conversationId,
                  }),
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok ||
            !data?.success
          ) {
            return;
          }

          if (
            typeof data.totalUnread ===
            "number"
          ) {
            setTotalUnread(
              data.totalUnread
            );
          }

          /*
           * อัปเดต Unread ของห้อง
           * บนหน้าเว็บทันที
           */
          setConversations(
            (
              current
            ) =>
              current.map(
                (
                  conversation
                ) =>
                  conversation.id ===
                  conversationId
                    ? {
                        ...conversation,

                        unreadCount:
                          0,
                      }
                    : conversation
              )
          );
        } catch (error) {
          console.error(
            "Mark read error:",
            error
          );
        }
      },
      []
    );

  /*
   * =========================================================
   * LOAD CONVERSATION
   * =========================================================
   */

  const loadConversation =
    useCallback(
      async (
        conversationId: number,
        showLoading = true,
        markRead = true
      ) => {
        try {
          if (
            showLoading
          ) {
            setChatLoading(
              true
            );
          }

          setChatError(
            ""
          );

          const response =
            await fetch(
              `/api/messages?conversationId=${conversationId}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            response.status ===
            401
          ) {
            router.push(
              "/"
            );

            return;
          }

          if (
            !response.ok ||
            !data?.success
          ) {
            setChatError(
              data?.message ||
                "ไม่สามารถโหลดข้อความได้"
            );

            return;
          }

          setActiveConversation(
            data.conversation
          );

          setMessages(
            Array.isArray(
              data.messages
            )
              ? data.messages
              : []
          );

          /*
           * เปิดห้องแล้ว
           * Mark unread จริง
           */
          if (
            markRead &&
            data.conversation
              ?.unreadCount >
              0
          ) {
            await markConversationAsRead(
              conversationId
            );
          }
        } catch (error) {
          console.error(
            "Load conversation error:",
            error
          );

          setChatError(
            "ไม่สามารถเชื่อมต่อเพื่อโหลดห้องสนทนาได้"
          );
        } finally {
          if (
            showLoading
          ) {
            setChatLoading(
              false
            );
          }
        }
      },
      [
        router,
        markConversationAsRead,
      ]
    );

  /*
   * =========================================================
   * FIRST LOAD
   * =========================================================
   */

  useEffect(() => {
    void loadProfile();

    void loadConversations();
  }, [
    loadProfile,
    loadConversations,
  ]);

  /*
   * =========================================================
   * OPEN FIRST CONVERSATION
   * =========================================================
   *
   * ถ้ายังไม่ได้เลือกห้อง
   * และมีห้องอยู่แล้ว
   * เปิดห้องแรกให้
   */
  useEffect(() => {
    if (
      selectedConversationId !==
      null
    ) {
      return;
    }

    if (
      conversations.length ===
      0
    ) {
      return;
    }

    const firstConversation =
      conversations[0];

    setSelectedConversationId(
      firstConversation.id
    );

    void loadConversation(
      firstConversation.id
    );
  }, [
    conversations,
    selectedConversationId,
    loadConversation,
  ]);

  /*
   * =========================================================
   * POLLING
   * =========================================================
   *
   * ยังไม่ใช้ WebSocket
   *
   * ทุก 5 วินาที:
   *
   * - Refresh Conversation List
   * - Refresh ห้องปัจจุบัน
   *
   * ไม่มี Fake Message
   */
  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          void loadConversations(
            false
          );

          if (
            selectedConversationId
          ) {
            void loadConversation(
              selectedConversationId,
              false,
              true
            );
          }
        },
        5000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    selectedConversationId,
    loadConversations,
    loadConversation,
  ]);

  /*
   * =========================================================
   * AUTO SCROLL
   * =========================================================
   */

  useEffect(() => {
    if (
      messages.length ===
      previousMessageCountRef.current
    ) {
      return;
    }

    previousMessageCountRef.current =
      messages.length;

    messagesEndRef.current?.scrollIntoView({
      behavior:
        "smooth",
    });
  }, [
    messages,
  ]);

  /*
   * =========================================================
   * OPEN CONVERSATION
   * =========================================================
   */

  async function openConversation(
    conversationId: number
  ) {
    if (
      conversationId ===
      selectedConversationId
    ) {
      return;
    }

    setSelectedConversationId(
      conversationId
    );

    setMessages(
      []
    );

    setActiveConversation(
      null
    );

    await loadConversation(
      conversationId
    );
  }

  /*
   * =========================================================
   * SEND MESSAGE
   * =========================================================
   */

  async function sendMessage(
    event?:
      FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    if (
      !selectedConversationId ||
      sending
    ) {
      return;
    }

    const content =
      messageInput.trim();

    if (!content) {
      return;
    }

    if (
      content.length >
      5000
    ) {
      setChatError(
        "ข้อความยาวเกิน 5,000 ตัวอักษร"
      );

      return;
    }

    try {
      setSending(
        true
      );

      setChatError(
        ""
      );

      const response =
        await fetch(
          "/api/messages",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "send",

                conversationId:
                  selectedConversationId,

                content,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        !data?.success
      ) {
        setChatError(
          data?.message ||
            "ไม่สามารถส่งข้อความได้"
        );

        return;
      }

      /*
       * Clear Input
       */
      setMessageInput(
        ""
      );

      /*
       * เติม Message ใหม่ทันที
       * ไม่ต้องรอ Poll
       */
      if (
        data.message
      ) {
        setMessages(
          (
            current
          ) => [
            ...current,
            data.message,
          ]
        );
      }

      /*
       * Refresh รายการห้อง
       * เพื่อ Last Message
       */
      await loadConversations(
        false
      );
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      setChatError(
        "ไม่สามารถเชื่อมต่อเพื่อส่งข้อความได้"
      );
    } finally {
      setSending(
        false
      );
    }
  }

  /*
   * =========================================================
   * ENTER TO SEND
   * =========================================================
   */

  function handleMessageKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>
  ) {
    /*
     * Enter = Send
     *
     * Shift + Enter = New Line
     */
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage();
    }
  }

  /*
   * =========================================================
   * SEARCH USER
   * =========================================================
   */

  useEffect(() => {
    if (
      !newChatOpen
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          try {
            setSearchLoading(
              true
            );

            const params =
              new URLSearchParams();

            params.set(
              "mode",
              "users"
            );

            if (
              userSearch.trim()
            ) {
              params.set(
                "q",
                userSearch.trim()
              );
            }

            const response =
              await fetch(
                `/api/messages?${params.toString()}`,
                {
                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            if (
              !response.ok ||
              !data?.success
            ) {
              setSearchUsers(
                []
              );

              return;
            }

            setSearchUsers(
              Array.isArray(
                data.users
              )
                ? data.users
                : []
            );
          } catch (error) {
            console.error(
              "Search users error:",
              error
            );

            setSearchUsers(
              []
            );
          } finally {
            setSearchLoading(
              false
            );
          }
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    newChatOpen,
    userSearch,
  ]);

  /*
   * =========================================================
   * START CHAT
   * =========================================================
   */

  async function startChat(
    selectedUser:
      SearchUser
  ) {
    try {
      setOpeningUserId(
        selectedUser.id
      );

      /*
       * ถ้ามี Conversation อยู่แล้ว
       * ใช้ห้องเดิมเลย
       */
      if (
        selectedUser.conversationId
      ) {
        const conversationId =
          selectedUser.conversationId;

        setNewChatOpen(
          false
        );

        setUserSearch(
          ""
        );

        setSelectedConversationId(
          conversationId
        );

        await loadConversation(
          conversationId
        );

        return;
      }

      /*
       * สร้างห้องใหม่
       */
      const response =
        await fetch(
          "/api/messages",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "open",

                userId:
                  selectedUser.id,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        !data?.success
      ) {
        return;
      }

      const conversationId =
        data.conversation
          .id as number;

      setNewChatOpen(
        false
      );

      setUserSearch(
        ""
      );

      setSelectedConversationId(
        conversationId
      );

      await loadConversations(
        false
      );

      await loadConversation(
        conversationId
      );
    } catch (error) {
      console.error(
        "Start chat error:",
        error
      );
    } finally {
      setOpeningUserId(
        null
      );
    }
  }

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  async function logout() {
    resetWallet(
      "ออกจากระบบแล้ว กรุณา Connect Wallet ใหม่"
    );

    try {
      await fetch(
        "/api/logout",
        {
          method:
            "POST",

          credentials:
            "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    router.push(
      "/"
    );

    router.refresh();
  }

  /*
   * =========================================================
   * SELECTED CONVERSATION
   * =========================================================
   */

  const selectedConversation =
    useMemo(
      () =>
        conversations.find(
          (
            conversation
          ) =>
            conversation.id ===
            selectedConversationId
        ) ??
        null,
      [
        conversations,
        selectedConversationId,
      ]
    );

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <main
      className="
        flex
        h-screen
        overflow-hidden
        bg-[#050816]
        text-white
      "
    >
      {/* ========================================= */}
      {/* SIDEBAR */}
      {/* ========================================= */}

      <aside
        className="
          h-screen
          shrink-0
          overflow-hidden
        "
      >
        <Sidebar />
      </aside>

      {/* ========================================= */}
      {/* MAIN */}
      {/* ========================================= */}

      <section
        className="
          flex
          h-screen
          min-w-0
          flex-1
          flex-col
          overflow-hidden
          px-6
          py-5
        "
      >
        {/* ======================================= */}
        {/* TOP BAR */}
        {/* ======================================= */}

        <div
          className="
            mb-5
            flex
            shrink-0
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-sm
                text-violet-300
              "
            >
              SkillChain Chat
            </p>

            <h1
              className="
                text-3xl
                font-bold
              "
            >
              ข้อความ
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              สนทนากับผู้เรียนและผู้สอนใน SkillChain
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            {/* NOTIFICATION */}

            <div
              className="
                relative
              "
            >
              <button
                type="button"
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-[#111a33]
                  transition
                  hover:bg-[#182442]
                "
              >
                <Bell
                  size={18}
                />
              </button>

              {totalUnread >
                0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    min-h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  {totalUnread >
                  99
                    ? "99+"
                    : totalUnread}
                </span>
              )}
            </div>

            {/* PROFILE */}

            <div
              className="
                relative
              "
            >
              <button
                type="button"
                onClick={() =>
                  setOpenProfile(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-[#111a33]
                  px-5
                  py-3
                  transition
                  hover:bg-[#182442]
                "
              >
                <UserRound
                  size={17}
                />

                <span>
                  {user?.name ||
                    "User"}
                </span>

                <ChevronDown
                  size={16}
                  className={`
                    transition

                    ${
                      openProfile
                        ? "rotate-180"
                        : ""
                    }
                  `}
                />
              </button>

              {openProfile && (
                <div
                  className="
                    absolute
                    right-0
                    top-14
                    z-50
                    w-64
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#111a33]
                    p-4
                    shadow-2xl
                  "
                >
                  <div
                    className="
                      mb-3
                      border-b
                      border-white/10
                      pb-3
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      {user?.name ||
                        "User"}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      {user?.email ||
                        ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/profile"
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-slate-300
                      transition
                      hover:bg-white/5
                      hover:text-white
                    "
                  >
                    โปรไฟล์
                  </button>

                  <button
                    type="button"
                    onClick={
                      logout
                    }
                    className="
                      mt-1
                      w-full
                      rounded-xl
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-red-400
                      transition
                      hover:bg-red-500/10
                    "
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* CHAT LAYOUT */}
        {/* ======================================= */}

        <div
          className="
            grid
            min-h-0
            flex-1
            overflow-hidden
            rounded-[30px]
            border
            border-white/10
            bg-[#0b1028]
            lg:grid-cols-[340px_1fr]
          "
        >
          {/* ===================================== */}
          {/* CONVERSATION LIST */}
          {/* ===================================== */}

          <aside
            className="
              flex
              min-h-0
              flex-col
              border-r
              border-white/10
              bg-[#0d1430]
            "
          >
            {/* LIST HEADER */}

            <div
              className="
                shrink-0
                border-b
                border-white/10
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h2
                    className="
                      font-bold
                    "
                  >
                    การสนทนา
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    {totalUnread >
                    0
                      ? `${totalUnread} ข้อความที่ยังไม่ได้อ่าน`
                      : "ไม่มีข้อความใหม่"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNewChatOpen(
                      true
                    )
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-600
                    text-white
                    transition
                    hover:bg-violet-500
                  "
                  title="เริ่มแชตใหม่"
                >
                  <Plus
                    size={19}
                  />
                </button>
              </div>
            </div>

            {/* LIST BODY */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                p-2
              "
            >
              {conversationsLoading ? (
                <div
                  className="
                    flex
                    h-40
                    items-center
                    justify-center
                  "
                >
                  <Loader2
                    size={24}
                    className="
                      animate-spin
                      text-violet-400
                    "
                  />
                </div>
              ) : conversationsError ? (
                <div
                  className="
                    m-2
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/10
                    p-4
                    text-sm
                    text-red-300
                  "
                >
                  {conversationsError}
                </div>
              ) : conversations.length ===
                0 ? (
                <div
                  className="
                    flex
                    h-full
                    min-h-64
                    flex-col
                    items-center
                    justify-center
                    px-6
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-violet-500/10
                      text-violet-300
                    "
                  >
                    <MessageCircle
                      size={25}
                    />
                  </div>

                  <h3
                    className="
                      mt-4
                      text-sm
                      font-semibold
                    "
                  >
                    ยังไม่มีการสนทนา
                  </h3>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-slate-500
                    "
                  >
                    กดปุ่ม + เพื่อค้นหาผู้ใช้และเริ่มส่งข้อความ
                  </p>
                </div>
              ) : (
                <div
                  className="
                    space-y-1
                  "
                >
                  {conversations.map(
                    (
                      conversation
                    ) => {
                      const active =
                        conversation.id ===
                        selectedConversationId;

                      return (
                        <button
                          key={
                            conversation.id
                          }
                          type="button"
                          onClick={() =>
                            void openConversation(
                              conversation.id
                            )
                          }
                          className={`
                            flex
                            w-full
                            items-start
                            gap-3
                            rounded-2xl
                            p-3
                            text-left
                            transition

                            ${
                              active
                                ? `
                                  bg-violet-500/15
                                  text-white
                                `
                                : `
                                  hover:bg-white/5
                                `
                            }
                          `}
                        >
                          {/* AVATAR */}

                          <UserAvatar
                            user={
                              conversation.otherUser
                            }
                          />

                          {/* BODY */}

                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-2
                              "
                            >
                              <p
                                className={`
                                  truncate
                                  text-sm

                                  ${
                                    conversation.unreadCount >
                                    0
                                      ? "font-bold text-white"
                                      : "font-semibold text-slate-200"
                                  }
                                `}
                              >
                                {getUserName(
                                  conversation.otherUser
                                )}
                              </p>

                              {conversation.lastMessage && (
                                <span
                                  className="
                                    shrink-0
                                    text-[10px]
                                    text-slate-600
                                  "
                                >
                                  {formatChatTime(
                                    conversation.lastMessage
                                      .createdAt
                                  )}
                                </span>
                              )}
                            </div>

                            <div
                              className="
                                mt-1
                                flex
                                items-center
                                gap-2
                              "
                            >
                              <p
                                className={`
                                  min-w-0
                                  flex-1
                                  truncate
                                  text-xs

                                  ${
                                    conversation.unreadCount >
                                    0
                                      ? "font-medium text-slate-300"
                                      : "text-slate-500"
                                  }
                                `}
                              >
                                {conversation.lastMessage
                                  ? `${
                                      conversation.lastMessage
                                        .senderId ===
                                      user?.id
                                        ? "คุณ: "
                                        : ""
                                    }${conversation.lastMessage.content}`
                                  : "เริ่มการสนทนา"}
                              </p>

                              {conversation.unreadCount >
                                0 && (
                                <span
                                  className="
                                    flex
                                    min-h-5
                                    min-w-5
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-violet-600
                                    px-1
                                    text-[10px]
                                    font-bold
                                    text-white
                                  "
                                >
                                  {conversation.unreadCount >
                                  99
                                    ? "99+"
                                    : conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ===================================== */}
          {/* CHAT AREA */}
          {/* ===================================== */}

          <div
            className="
              flex
              min-h-0
              min-w-0
              flex-col
            "
          >
            {!selectedConversationId ? (
              /*
               * =================================
               * NO CHAT SELECTED
               * =================================
               */
              <div
                className="
                  flex
                  h-full
                  flex-col
                  items-center
                  justify-center
                  p-8
                  text-center
                "
              >
                <div
                  className="
                    flex
                    h-20
                    w-20
                    items-center
                    justify-center
                    rounded-[26px]
                    bg-violet-500/10
                    text-violet-300
                  "
                >
                  <MessageCircle
                    size={34}
                  />
                </div>

                <h2
                  className="
                    mt-5
                    text-xl
                    font-bold
                  "
                >
                  SkillChain Messages
                </h2>

                <p
                  className="
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  เลือกห้องสนทนาทางซ้าย หรือเริ่มแชตใหม่กับผู้ใช้ในระบบ
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setNewChatOpen(
                      true
                    )
                  }
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-violet-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-violet-500
                  "
                >
                  <Plus
                    size={17}
                  />

                  เริ่มการสนทนา
                </button>
              </div>
            ) : (
              <>
                {/* =============================== */}
                {/* CHAT HEADER */}
                {/* =============================== */}

                <header
                  className="
                    flex
                    h-[76px]
                    shrink-0
                    items-center
                    justify-between
                    border-b
                    border-white/10
                    px-5
                  "
                >
                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                    "
                  >
                    <UserAvatar
                      user={
                        activeConversation
                          ?.otherUser ||
                        selectedConversation
                          ?.otherUser ||
                        {
                          id:
                            0,

                          name:
                            null,

                          email:
                            "",
                        }
                      }
                    />

                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className="
                          truncate
                          font-semibold
                        "
                      >
                        {getUserName(
                          activeConversation
                            ?.otherUser ||
                            selectedConversation
                              ?.otherUser ||
                            null
                        )}
                      </p>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-xs
                          text-slate-500
                        "
                      >
                        {activeConversation
                          ?.otherUser
                          .email ||
                          selectedConversation
                            ?.otherUser
                            .email ||
                          ""}
                      </p>
                    </div>
                  </div>
                </header>

                {/* =============================== */}
                {/* MESSAGES */}
                {/* =============================== */}

                <div
                  className="
                    min-h-0
                    flex-1
                    overflow-y-auto
                    px-5
                    py-5
                  "
                >
                  {chatLoading ? (
                    <div
                      className="
                        flex
                        h-full
                        items-center
                        justify-center
                      "
                    >
                      <Loader2
                        size={28}
                        className="
                          animate-spin
                          text-violet-400
                        "
                      />
                    </div>
                  ) : chatError &&
                    messages.length ===
                      0 ? (
                    <div
                      className="
                        flex
                        h-full
                        items-center
                        justify-center
                        text-center
                      "
                    >
                      <div>
                        <p
                          className="
                            text-sm
                            text-red-300
                          "
                        >
                          {chatError}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void loadConversation(
                              selectedConversationId
                            )
                          }
                          className="
                            mt-4
                            rounded-xl
                            bg-violet-600
                            px-4
                            py-2
                            text-sm
                          "
                        >
                          ลองอีกครั้ง
                        </button>
                      </div>
                    </div>
                  ) : messages.length ===
                    0 ? (
                    <div
                      className="
                        flex
                        h-full
                        flex-col
                        items-center
                        justify-center
                        text-center
                      "
                    >
                      <MessageCircle
                        size={34}
                        className="
                          text-violet-400
                        "
                      />

                      <p
                        className="
                          mt-4
                          font-semibold
                        "
                      >
                        เริ่มการสนทนา
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-slate-500
                        "
                      >
                        ส่งข้อความแรกของคุณได้เลย
                      </p>
                    </div>
                  ) : (
                    <div
                      className="
                        space-y-3
                      "
                    >
                      {messages.map(
                        (
                          message
                        ) => (
                          <MessageBubble
                            key={
                              message.id
                            }
                            message={
                              message
                            }
                            isMine={
                              message.senderId ===
                              user?.id
                            }
                          />
                        )
                      )}

                      <div
                        ref={
                          messagesEndRef
                        }
                      />
                    </div>
                  )}
                </div>

                {/* =============================== */}
                {/* SEND ERROR */}
                {/* =============================== */}

                {chatError &&
                  messages.length >
                    0 && (
                    <div
                      className="
                        shrink-0
                        px-5
                        pb-2
                      "
                    >
                      <div
                        className="
                          rounded-xl
                          border
                          border-red-500/20
                          bg-red-500/10
                          px-4
                          py-2
                          text-xs
                          text-red-300
                        "
                      >
                        {chatError}
                      </div>
                    </div>
                  )}

                {/* =============================== */}
                {/* INPUT */}
                {/* =============================== */}

                <form
                  onSubmit={
                    sendMessage
                  }
                  className="
                    shrink-0
                    border-t
                    border-white/10
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-end
                      gap-3
                    "
                  >
                    <textarea
                      value={
                        messageInput
                      }
                      onChange={(
                        event
                      ) =>
                        setMessageInput(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={
                        handleMessageKeyDown
                      }
                      disabled={
                        sending
                      }
                      maxLength={
                        5000
                      }
                      rows={
                        1
                      }
                      placeholder="พิมพ์ข้อความ..."
                      className="
                        min-h-[48px]
                        max-h-32
                        flex-1
                        resize-none
                        rounded-2xl
                        border
                        border-white/10
                        bg-[#111a33]
                        px-4
                        py-3
                        text-sm
                        text-white
                        outline-none
                        transition
                        placeholder:text-slate-600
                        focus:border-violet-500/50
                        focus:ring-4
                        focus:ring-violet-500/10
                        disabled:opacity-50
                      "
                    />

                    <button
                      type="submit"
                      disabled={
                        sending ||
                        !messageInput.trim()
                      }
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        bg-violet-600
                        text-white
                        transition
                        hover:bg-violet-500
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      {sending ? (
                        <Loader2
                          size={19}
                          className="
                            animate-spin
                          "
                        />
                      ) : (
                        <Send
                          size={19}
                        />
                      )}
                    </button>
                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        text-slate-600
                      "
                    >
                      Enter เพื่อส่ง • Shift + Enter เพื่อขึ้นบรรทัดใหม่
                    </p>

                    <p
                      className="
                        text-[10px]
                        text-slate-600
                      "
                    >
                      {
                        messageInput.length
                      }
                      /5000
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* NEW CHAT MODAL */}
      {/* ========================================= */}

      {newChatOpen && (
        <div
          className="
            fixed
            inset-0
            z-[120]
            flex
            items-center
            justify-center
            bg-black/70
            px-4
            backdrop-blur-sm
          "
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setNewChatOpen(
                false
              );
            }
          }}
        >
          <div
            className="
              w-full
              max-w-lg
              overflow-hidden
              rounded-[28px]
              border
              border-violet-500/20
              bg-[#0b1028]
              shadow-2xl
            "
          >
            {/* MODAL HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-white/10
                p-5
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    text-violet-300
                  "
                >
                  New Conversation
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                  "
                >
                  เริ่มการสนทนาใหม่
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNewChatOpen(
                    false
                  )
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/10
                  text-slate-400
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
              >
                <X
                  size={18}
                />
              </button>
            </div>

            {/* SEARCH */}

            <div
              className="
                p-5
              "
            >
              <div
                className="
                  relative
                "
              >
                <Search
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                />

                <input
                  value={
                    userSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setUserSearch(
                      event.target
                        .value
                    )
                  }
                  autoFocus
                  placeholder="ค้นหาชื่อหรืออีเมล..."
                  className="
                    h-12
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#111a33]
                    pl-11
                    pr-4
                    text-sm
                    outline-none
                    transition
                    placeholder:text-slate-600
                    focus:border-violet-500/50
                  "
                />
              </div>

              {/* USER LIST */}

              <div
                className="
                  mt-4
                  max-h-[420px]
                  min-h-[180px]
                  overflow-y-auto
                "
              >
                {searchLoading ? (
                  <div
                    className="
                      flex
                      h-40
                      items-center
                      justify-center
                    "
                  >
                    <Loader2
                      size={24}
                      className="
                        animate-spin
                        text-violet-400
                      "
                    />
                  </div>
                ) : searchUsers.length ===
                  0 ? (
                  <div
                    className="
                      flex
                      h-40
                      flex-col
                      items-center
                      justify-center
                      text-center
                    "
                  >
                    <Users
                      size={27}
                      className="
                        text-slate-600
                      "
                    />

                    <p
                      className="
                        mt-3
                        text-sm
                        text-slate-500
                      "
                    >
                      ไม่พบผู้ใช้งาน
                    </p>
                  </div>
                ) : (
                  <div
                    className="
                      space-y-2
                    "
                  >
                    {searchUsers.map(
                      (
                        searchUser
                      ) => (
                        <button
                          key={
                            searchUser.id
                          }
                          type="button"
                          disabled={
                            openingUserId ===
                            searchUser.id
                          }
                          onClick={() =>
                            void startChat(
                              searchUser
                            )
                          }
                          className="
                            flex
                            w-full
                            items-center
                            gap-3
                            rounded-2xl
                            border
                            border-transparent
                            p-3
                            text-left
                            transition
                            hover:border-violet-500/20
                            hover:bg-violet-500/5
                            disabled:opacity-50
                          "
                        >
                          <UserAvatar
                            user={
                              searchUser
                            }
                          />

                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >
                            <p
                              className="
                                truncate
                                text-sm
                                font-semibold
                              "
                            >
                              {getUserName(
                                searchUser
                              )}
                            </p>

                            <p
                              className="
                                mt-1
                                truncate
                                text-xs
                                text-slate-500
                              "
                            >
                              {
                                searchUser.email
                              }
                            </p>
                          </div>

                          {openingUserId ===
                          searchUser.id ? (
                            <Loader2
                              size={18}
                              className="
                                animate-spin
                                text-violet-400
                              "
                            />
                          ) : (
                            <div
                              className="
                                rounded-full
                                bg-violet-500/10
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-violet-300
                              "
                            >
                              {searchUser.conversationId
                                ? "เปิดแชต"
                                : "เริ่มแชต"}
                            </div>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * =========================================================
 * USER AVATAR
 * =========================================================
 */

function UserAvatar({
  user,
}: {
  user:
    ChatUser;
}) {
  const displayName =
    getUserName(
      user
    );

  const firstLetter =
    displayName
      .trim()
      .charAt(
        0
      )
      .toUpperCase() ||
    "U";

  return (
    <div
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        from-violet-500/30
        to-fuchsia-500/20
        text-sm
        font-bold
        text-violet-100
      "
    >
      {firstLetter}
    </div>
  );
}

/*
 * =========================================================
 * MESSAGE BUBBLE
 * =========================================================
 */

function MessageBubble({
  message,
  isMine,
}: {
  message:
    ChatMessage;

  isMine:
    boolean;
}) {
  return (
    <div
      className={`
        flex

        ${
          isMine
            ? "justify-end"
            : "justify-start"
        }
      `}
    >
      <div
        className={`
          max-w-[78%]
          rounded-[20px]
          px-4
          py-3

          ${
            isMine
              ? `
                rounded-br-md
                bg-violet-600
                text-white
              `
              : `
                rounded-bl-md
                border
                border-white/10
                bg-[#111a33]
                text-slate-200
              `
          }
        `}
      >
        <p
          className="
            whitespace-pre-wrap
            break-words
            text-sm
            leading-6
          "
        >
          {message.content}
        </p>

        <div
          className={`
            mt-1.5
            flex
            items-center
            gap-1.5
            text-[10px]

            ${
              isMine
                ? "justify-end text-violet-200"
                : "text-slate-600"
            }
          `}
        >
          <span>
            {formatMessageTime(
              message.createdAt
            )}
          </span>

          {isMine && (
            message.readAt ? (
              <CheckCheck
                size={13}
              />
            ) : (
              <Check
                size={13}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * USER NAME
 * =========================================================
 */

function getUserName(
  user:
    ChatUser | null
) {
  if (!user) {
    return "ผู้ใช้งาน";
  }

  const name =
    user.name
      ?.trim();

  if (name) {
    return name;
  }

  if (
    user.email
  ) {
    return user.email;
  }

  return `User #${user.id}`;
}

/*
 * =========================================================
 * CHAT TIME
 * =========================================================
 */

function formatChatTime(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (
    sameDay
  ) {
    return date.toLocaleTimeString(
      "th-TH",
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  }

  return date.toLocaleDateString(
    "th-TH",
    {
      day:
        "numeric",

      month:
        "short",
    }
  );
}

/*
 * =========================================================
 * MESSAGE TIME
 * =========================================================
 */

function formatMessageTime(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    "th-TH",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}