-- Add WhatsApp AI Assistant fields to the weddings table

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean DEFAULT false;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS notification_preference text DEFAULT 'Daily' CHECK (notification_preference IN ('Daily', 'Weekly', 'Alerts'));
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS last_message_sent_at timestamp with time zone;

-- Also add assignee phone number to the tasks table for Family Support messages
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_name text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_phone text;
