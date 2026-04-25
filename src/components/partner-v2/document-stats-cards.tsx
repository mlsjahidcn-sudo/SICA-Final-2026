"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidToken } from "@/lib/auth-token";
import {
  IconFile,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconFilePlus,
} from "@tabler/icons-react";

interface DocumentStats {
  documents: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  expiry: {
    expiring: number;
    expired: number;
  };
  requests: {
    pending: number;
    in_progress: number;
    fulfilled: number;
    overdue: number;
  };
  recent_activity: {
    uploads_7d: number;
    verifications_7d: number;
  };
}

export function DocumentStatsCards() {
  const [stats, setStats] = React.useState<DocumentStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getValidToken();
        if (!token) return;

        const response = await fetch("/api/partner/documents/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch stats");

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching document stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Documents",
      value: stats.documents.total,
      description: `${stats.recent_activity.uploads_7d} uploaded this week`,
      icon: <IconFile className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Pending Verification",
      value: stats.documents.pending,
      description: `${stats.recent_activity.verifications_7d} verified this week`,
      icon: <IconClock className="h-4 w-4 text-orange-500" />,
    },
    {
      title: "Verified",
      value: stats.documents.verified,
      description: "Documents approved",
      icon: <IconCheck className="h-4 w-4 text-green-500" />,
    },
    {
      title: "Rejected",
      value: stats.documents.rejected,
      description: "Documents rejected",
      icon: <IconX className="h-4 w-4 text-red-500" />,
    },
  ];

  const expiryCards = [
    {
      title: "Expiring Soon",
      value: stats.expiry.expiring,
      description: "Within 30 days",
      icon: <IconAlertTriangle className="h-4 w-4 text-orange-500" />,
      variant: "warning" as const,
    },
    {
      title: "Expired",
      value: stats.expiry.expired,
      description: "Need renewal",
      icon: <IconAlertTriangle className="h-4 w-4 text-red-500" />,
      variant: "destructive" as const,
    },
  ];

  const requestCards = [
    {
      title: "Pending Requests",
      value: stats.requests.pending,
      description: "Awaiting student action",
      icon: <IconFilePlus className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Overdue Requests",
      value: stats.requests.overdue,
      description: "Past due date",
      icon: <IconAlertTriangle className="h-4 w-4 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Document Status */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Document Status</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Expiry Alerts */}
      {(stats.expiry.expiring > 0 || stats.expiry.expired > 0) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Expiry Alerts</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {expiryCards.map((card) => (
              <Card key={card.title} className={card.variant === "destructive" ? "border-destructive" : card.variant === "warning" ? "border-orange-500" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Document Requests */}
      {(stats.requests.pending > 0 || stats.requests.overdue > 0) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Document Requests</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {requestCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
