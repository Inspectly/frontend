import { useState } from "react";
import { Search, Send, Paperclip, CheckCheck, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  project: string;
  online: boolean;
}

const conversations: Conversation[] = [
  { id: "1", name: "John D.", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", lastMessage: "Materials arrived, I'll start tomorrow morning", time: "2m", unread: 0, project: "Panel Upgrade", online: true },
  { id: "2", name: "Alex K.", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", lastMessage: "Looks great! What time will you finish?", time: "1h", unread: 2, project: "Outdoor Lighting", online: true },
  { id: "3", name: "Sarah M.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face", lastMessage: "See you Monday!", time: "3h", unread: 0, project: "Basement Wiring", online: false },
  { id: "4", name: "Tom R.", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", lastMessage: "Thanks for the great work!", time: "2d", unread: 0, project: "GFCI Upgrade", online: false },
];

const mockMessages = [
  { id: "1", sender: "them", text: "Hi Mike! When can you start on the panel?", time: "9:00 AM" },
  { id: "2", sender: "me", text: "Hi John! I can start this Wednesday. I'll need about 3 days for the full upgrade.", time: "9:15 AM" },
  { id: "3", sender: "them", text: "Perfect. Will you need access to the basement?", time: "9:20 AM" },
  { id: "4", sender: "me", text: "Yes, I'll need access to both the panel area and the basement junction. I'll also need the main breaker turned off for about 4 hours on the first day.", time: "9:25 AM", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop" },
  { id: "5", sender: "them", text: "No problem. I'll work from home that day. Anything else you need?", time: "9:30 AM" },
  { id: "6", sender: "me", text: "Materials arrived, I'll start tomorrow morning", time: "2:15 PM" },
];

const VendorMessages = () => {
  const [selected, setSelected] = useState(conversations[0]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.project.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.25rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-background shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${
                selected.id === conv.id ? "bg-muted/50" : ""
              }`}
            >
              <div className="relative shrink-0">
                <img src={conv.avatar} alt={conv.name} className="h-10 w-10 rounded-full object-cover" />
                {conv.online && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-green-500 text-background stroke-[3]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{conv.name}</span>
                  <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-xs text-primary">{conv.project}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {conv.unread}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <img src={selected.avatar} alt={selected.name} className="h-8 w-8 rounded-full object-cover" />
            <div>
              <p className="text-sm font-medium text-foreground">{selected.name}</p>
              <p className="text-[10px] text-primary">{selected.project}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[70%]">
                {(msg as any).image && (
                  <img
                    src={(msg as any).image}
                    alt="Shared photo"
                    className={`rounded-xl mb-1 max-h-48 w-full object-cover ${
                      msg.sender === "me" ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                  />
                )}
                <div className={`rounded-2xl px-4 py-2.5 ${
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
                    msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {msg.time}
                    {msg.sender === "me" && <CheckCheck className="h-3 w-3" />}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground shrink-0">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 h-9 text-sm rounded-full"
              onKeyDown={(e) => e.key === "Enter" && setMessage("")}
            />
            <Button size="icon" className="h-9 w-9 rounded-full shrink-0" variant="gold">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMessages;
