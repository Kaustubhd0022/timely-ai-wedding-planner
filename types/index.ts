export type User = {
  id: string;
  email: string;
  name?: string;
};

export type Wedding = {
  id: string;
  user_id: string;
  wedding_date: string;
  guest_count: number;
  budget_range: string;
  cultural_context: string;
  events_selected: string[];
  created_at: string;
};

export type TaskStatus = "Todo" | "In-Progress" | "Done";

export type Task = {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  event_type: string;
  deadline_date: string;
  status: TaskStatus;
  priority: number;
  notes?: string;
  assignee?: string;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  city: string;
  phone?: string;
  instagram_url?: string;
  website_url?: string;
  price_range: string;
  rating?: number;
};
