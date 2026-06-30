export interface SDKNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export async function sendNotification(_userId: string, _title: string, _body: string, _type?: string): Promise<void> {
  // Phase 3: wire into notification infrastructure
}

export async function getNotifications(_userId: string): Promise<SDKNotification[]> {
  return [];
}

export async function markAsRead(_notificationId: string): Promise<void> {
  // Phase 3: wire into notification infrastructure
}
