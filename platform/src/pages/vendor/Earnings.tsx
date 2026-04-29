import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: "1", title: "Electrical Panel Upgrade", homeowner: "John D.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", amount: 1440, type: "Payment", date: "Mar 7", status: "Received", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&h=80&fit=crop" },
  { id: "2", title: "Outdoor Lighting Install", homeowner: "Alex K.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", amount: 650, type: "Payment", date: "Mar 6", status: "Pending", propertyImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=100&h=80&fit=crop" },
  { id: "3", title: "Kitchen GFCI Upgrade", homeowner: "Tom R.", homeownerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face", amount: 350, type: "Payment", date: "Feb 20", status: "Received", propertyImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&h=80&fit=crop" },
  { id: "4", title: "Garage Sub-Panel Install", homeowner: "James M.", homeownerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face", amount: 1800, type: "Payment", date: "Feb 18", status: "Received", propertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=80&fit=crop" },
  { id: "5", title: "Platform Fee — February", homeowner: "Inspectly", homeownerAvatar: "", amount: -215, type: "Fee", date: "Mar 1", status: "Deducted", propertyImage: "" },
];

const Earnings = () => {
  const totalEarned = 28400;
  const thisMonth = 4250;
  const pending = 1610;
  const monthlyGoal = 6000;
  const goalProgress = Math.round((thisMonth / monthlyGoal) * 100);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your income and payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Earned", value: `$${totalEarned.toLocaleString()}`, icon: DollarSign, iconBg: "bg-green-50", iconColor: "text-green-600", sub: "All time" },
          { label: "This Month", value: `$${thisMonth.toLocaleString()}`, icon: TrendingUp, iconBg: "bg-primary/5", iconColor: "text-primary", sub: "+12% vs last month" },
          { label: "Pending", value: `$${pending.toLocaleString()}`, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600", sub: "2 payments" },
          { label: "Completed Jobs", value: "47", icon: CheckCircle2, iconBg: "bg-blue-50", iconColor: "text-blue-600", sub: "Since joining" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-primary mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goal + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground text-sm mb-4">Monthly Goal</h2>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-foreground">${thisMonth.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">of ${monthlyGoal.toLocaleString()} target</p>
            </div>
            <Progress value={goalProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-center">{goalProgress}% — ${(monthlyGoal - thisMonth).toLocaleString()} remaining</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border">
          <CardContent className="p-0">
            <div className="px-5 pt-4 pb-2">
              <h2 className="font-semibold text-foreground text-sm">Recent Transactions</h2>
            </div>
            <div className="px-5 pb-4 space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  {tx.propertyImage ? (
                    <img src={tx.propertyImage} alt={tx.title} className="h-10 w-14 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.amount > 0 ? "bg-green-100" : "bg-destructive/10"
                    }`}>
                      {tx.amount > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{tx.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tx.homeownerAvatar && (
                        <img src={tx.homeownerAvatar} alt={tx.homeowner} className="h-4 w-4 rounded-full object-cover" />
                      )}
                      <p className="text-xs text-muted-foreground">{tx.homeowner} · {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? "text-green-600" : "text-destructive"}`}>
                      {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <Badge className={`text-[10px] h-4 ${
                      tx.status === "Received" ? "bg-green-100 text-green-700" :
                      tx.status === "Pending" ? "bg-amber-100 text-amber-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Earnings;
