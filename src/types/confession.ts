export type ConfessionCategory = 'Γενικά' | 'ΠΑΜΑΚ' | 'ΑΠΘ' | 'ΔΙΠΑΕ' | 'Events';

export const CATEGORIES: {
  id: ConfessionCategory;
  label: string;
  tag: string;
}[] = [
  { id: 'Γενικά', label: 'Γενικά', tag: 'ΓΕΝΙΚΑ' },
  { id: 'ΠΑΜΑΚ', label: 'ΠΑΜΑΚ', tag: 'ΠΑΜΑΚ' },
  { id: 'ΑΠΘ', label: 'ΑΠΘ', tag: 'ΑΠΘ' },
  { id: 'ΔΙΠΑΕ', label: 'ΔΙΠΑΕ', tag: 'ΔΙΠΑΕ' },
  { id: 'Events', label: 'Events', tag: 'EVENTS' },
];

export interface CommentItem {
  id: string;
  confessionId: string;
  authorName: string;
  authorAvatar: string;
  authorToken: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  parentId?: string | null;
  replies?: CommentItem[];
  hasLiked?: boolean;
}

export interface ConfessionItem {
  id: string;
  content: string;
  category: ConfessionCategory;
  likes: number;
  authorToken?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  createdAt: string;
  
  // Campus Poll fields
  isPoll?: boolean;
  pollOptionA?: string | null;
  pollOptionB?: string | null;
  pollVotesA?: number;
  pollVotesB?: number;
  userVotedOption?: 'A' | 'B' | null;

  comments?: CommentItem[];
  _count?: {
    comments: number;
  };
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderToken: string;
  text: string;
  createdAt: string;
}

export type ConversationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface ConversationItem {
  id: string;
  confessionId: string;
  confession?: {
    id: string;
    content: string;
    category: string;
  };
  user1Token: string;
  user2Token: string;
  user1Name: string;
  user2Name: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages?: MessageItem[];
  lastMessage?: MessageItem | null;
}

export type SortOption = 'newest' | 'likes';

export type AppTheme = 'night' | 'light';
