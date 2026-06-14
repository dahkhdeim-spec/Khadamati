/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'provider' | 'admin';
  avatarUrl: string;
  createdAt: string;
  // Provider details
  bio?: string;
  experience?: string;
  category?: string;
  rating?: number;
  reviewsCount?: number;
  earnings?: number;
  isVerified?: boolean;
  location?: LocationData;
  skills?: string[];
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  price: number;
  commission: number;
  createdAt: string;
  updatedAt: string;
  location: LocationData;
  rating?: number;
  reviewText?: string;
}

export interface ChatThread {
  id: string; // e.g., 'customer_provider'
  customerId: string;
  customerName: string;
  customerAvatar: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  requestId?: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'request' | 'chat' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}
