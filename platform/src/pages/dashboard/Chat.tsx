import { useState } from "react";
import { Search, Send, Paperclip, MoreVertical, Check, CheckCheck, Circle, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  image?: string;
}

const mockConversations: Conversation[] = [
  { id: "1", vendorName: "Mike's Electrical", vendorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", property: "2-1781 Henrica Ave", issue: "Electrical panel upgrade", lastMessage: "I can start the work on Monday morning.", timestamp: "2:30 PM", unread: 2, online: true },
  { id: "2", vendorName: "AquaFlow Plumbing", vendorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", property: "2 Grosvernor Drive", issue: "Kitchen faucet leaking", lastMessage: "The parts have been ordered.", timestamp: "Yesterday", unread: 0, online: false },
  { id: "3", vendorName: "BuildRight Contractors", vendorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face", property: "2-1781 Henrica Ave", issue: "Deck railing loose", lastMessage: "Here's the updated quote for the railing repair.", timestamp: "Mar 5", unread: 0, online: true },
  { id: "4", vendorName: "ProFix Repairs", vendorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face", property: "45 Riverside Crescent", issue: "Basement waterproofing", lastMessage: "Thanks for accepting the offer!", timestamp: "Mar 3", unread: 0, online: false },
];

const mockMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender: "vendor", text: "Hi! I've reviewed the electrical panel issue at your Henrica Ave property. The panel is outdated and needs a full upgrade to meet current code.", time: "1:45 PM", read: true },
    { id: "m2", sender: "homeowner", text: "Thanks for the assessment. How long would the upgrade take?", time: "1:52 PM", read: true },
    { id: "m3", sender: "vendor", text: "Typically 6-8 hours for a full panel swap. I'd need to shut off power for about 4 hours during the main work.", time: "2:10 PM", read: true, image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop" },
    { id: "m4", sender: "homeowner", text: "That works. When can you start?", time: "2:18 PM", read: true },
    { id: "m5", sender: "vendor", text: "I can start the work on Monday morning.", time: "2:30 PM", read: false },
  ],
  "2": [
    { id: "m1", sender: "vendor", text: "I've inspected the kitchen faucet. The cartridge needs replacing and there's some corrosion on the supply lines.", time: "10:00 AM", read: true, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop" },
    { id: "m2", sender: "homeowner", text: "How much will the parts cost?", time: "10:15 AM", read: true },
    { id: "m3", sender: "vendor", text: "The parts have been ordered.", time: "11:30 AM", read: true },
  ],
  "3": [
    { id: "m1", sender: "vendor", text: "Here's the updated quote for the railing repair.", time: "3:00 PM", read: true },
  ],
  "4": [
    { id: "m1", sender: "vendor", text: "Thanks for accepting the offer!", time: "9:00 AM", read: true },
  ],
};

const Chat = () => {
  const [selectedConvo, setSelectedConvo] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const filtered = mockConversations.filter(
    (c) =>
      c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvo = mockConversations.find((c) => c.id === selectedConvo);
  const messages = mockMessages[selectedConvo] || [];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setNewMessage("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex animate-fade-up">
      {/* Conversations list */}
      <div className="w-80 lg:w-96 border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setSelectedConvo(convo.id)}
              className={`w-full text-left p-4 border-b border-border/50 transition-colors hover:bg-muted/50 ${
                selectedConvo === convo.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={convo.vendorAvatar}
                    alt={convo.vendorName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {convo.online && (
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-green-500 text-background stroke-[3]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">{convo.vendorName}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{convo.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{convo.property} · {convo.issue}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] h-5 w-5 p-0 flex items-center justify-center rounded-full shrink-0">
                    {convo.unread}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {activeConvo ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeConvo.vendorAvatar}
                  alt={activeConvo.vendorName}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{activeConvo.vendorName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {activeConvo.property} · {activeConvo.issue}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "homeowner" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%]`}>
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Shared photo"
                          className={`rounded-xl mb-1 max-h-48 w-full object-cover ${
                            msg.sender === "homeowner" ? "rounded-br-md" : "rounded-bl-md"
                          }`}
                        />
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          msg.sender === "homeowner"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-background border border-border text-foreground rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          msg.sender === "homeowner" ? "justify-end" : ""
                        }`}>
                          <span className={`text-[10px] ${
                            msg.sender === "homeowner" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {msg.time}
                          </span>
                          {msg.sender === "homeowner" && (
                            msg.read
                              ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              : <Check className="h-3 w-3 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-2 max-w-2xl mx-auto">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1 text-sm"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button
                  variant="gold"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
