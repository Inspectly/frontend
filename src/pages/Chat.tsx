import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPaperPlane,
  faPaperclip,
  faImage,
  faEllipsisVertical,
  faCheckDouble,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";

interface Conversation {
  id: string;
  vendorName: string;
  vendorAvatar: string;
  property: string;
  issue: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  sender: "homeowner" | "vendor";
  text: string;
  time: string;
  read: boolean;
}

const conversations: Conversation[] = [
  {
    id: "1",
    vendorName: "Mike's Electrical",
    vendorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    property: "2-1781 Henrica Ave",
    issue: "Electrical panel upgrade",
    lastMessage: "I can start the work on Monday morning.",
    timestamp: "2:30 PM",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    vendorName: "AquaFlow Plumbing",
    vendorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    property: "2 Grosvernor Drive",
    issue: "Kitchen faucet leaking",
    lastMessage: "The parts have been ordered.",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "3",
    vendorName: "BuildRight Contractors",
    vendorAvatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
    property: "2-1781 Henrica Ave",
    issue: "Deck railing loose",
    lastMessage: "Here's the updated quote for the railing repair.",
    timestamp: "Mar 5",
    unread: 0,
    online: true,
  },
  {
    id: "4",
    vendorName: "ProFix Repairs",
    vendorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    property: "45 Riverside Crescent",
    issue: "Basement waterproofing",
    lastMessage: "Thanks for accepting the offer!",
    timestamp: "Mar 3",
    unread: 0,
    online: false,
  },
];

const messages: Message[] = [
  {
    id: "m1",
    sender: "vendor",
    text: "Hi! I've reviewed the electrical panel issue at your Henrica Ave property. The panel is outdated and needs a full upgrade to meet current code.",
    time: "1:45 PM",
    read: true,
  },
  {
    id: "m2",
    sender: "homeowner",
    text: "Thanks for the assessment. How long would the upgrade take?",
    time: "1:52 PM",
    read: true,
  },
  {
    id: "m3",
    sender: "vendor",
    text: "Typically 6-8 hours for a full panel swap. I'd need to shut off power for about 4 hours during the main work.",
    time: "2:10 PM",
    read: true,
  },
  {
    id: "m4",
    sender: "homeowner",
    text: "That works. When can you start?",
    time: "2:18 PM",
    read: true,
  },
  {
    id: "m5",
    sender: "vendor",
    text: "I can start the work on Monday morning.",
    time: "2:30 PM",
    read: false,
  },
];

const activeConvo = conversations[0];

const Chat = () => {
  return (
    <div className="relative h-[calc(100vh-65px)] flex bg-white">
      {/* Mock chat UI (blurred, non-interactive) */}
      <div className="flex-1 flex blur-sm pointer-events-none select-none">
        {/* Conversations list */}
        <div className="w-80 lg:w-96 border-r border-neutral-200 flex flex-col bg-white">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Messages</h2>
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400"
              />
              <input
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none"
                readOnly
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className={`w-full text-left p-4 border-b border-neutral-100 ${
                  convo.id === activeConvo.id
                    ? "bg-gold-50 border-l-2 border-l-gold"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={convo.vendorAvatar}
                      alt={convo.vendorName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {convo.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-neutral-900 truncate">
                        {convo.vendorName}
                      </span>
                      <span className="text-[11px] text-neutral-500 shrink-0 ml-2">
                        {convo.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {convo.property} · {convo.issue}
                    </p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {convo.lastMessage}
                    </p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="bg-gold text-white text-[10px] font-semibold h-5 w-5 flex items-center justify-center rounded-full shrink-0">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat thread */}
        <div className="flex-1 flex flex-col bg-neutral-50">
          <div className="p-4 border-b border-neutral-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeConvo.vendorAvatar}
                alt={activeConvo.vendorName}
                className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {activeConvo.vendorName}
                </h3>
                <p className="text-xs text-neutral-500">
                  {activeConvo.property} · {activeConvo.issue}
                </p>
              </div>
            </div>
            <FontAwesomeIcon
              icon={faEllipsisVertical}
              className="h-4 w-4 text-neutral-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3 max-w-2xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "homeowner" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === "homeowner"
                        ? "bg-gold text-white rounded-br-md"
                        : "bg-white border border-neutral-200 text-neutral-900 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        msg.sender === "homeowner" ? "justify-end" : ""
                      }`}
                    >
                      <span
                        className={`text-[10px] ${
                          msg.sender === "homeowner"
                            ? "text-white/70"
                            : "text-neutral-500"
                        }`}
                      >
                        {msg.time}
                      </span>
                      {msg.sender === "homeowner" && (
                        <FontAwesomeIcon
                          icon={faCheckDouble}
                          className="h-2.5 w-2.5 text-white/70"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-neutral-200 bg-white">
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              <FontAwesomeIcon
                icon={faPaperclip}
                className="h-4 w-4 text-neutral-500"
              />
              <FontAwesomeIcon
                icon={faImage}
                className="h-4 w-4 text-neutral-500"
              />
              <input
                placeholder="Type a message..."
                className="flex-1 text-sm px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none"
                readOnly
              />
              <span className="h-9 w-9 shrink-0 bg-gold rounded-md flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  className="h-3.5 w-3.5 text-white"
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-12 max-w-md w-full text-center pointer-events-auto">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mb-6">
            <FontAwesomeIcon icon={faCommentDots} className="h-7 w-7 text-gold" />
          </div>
          <h3 className="text-2xl font-display font-bold text-neutral-900 mb-3">
            Chat Coming Soon
          </h3>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Messaging is on its way. You'll be able to chat with vendors directly here very soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
