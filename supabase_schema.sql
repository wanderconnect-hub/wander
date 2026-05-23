-- ==========================================
-- WanderConnect Supabase Database Schema
-- ==========================================

-- 1. PROFILES TABLE
-- Links with Supabase Auth users automatically
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT DEFAULT 'New Traveler',
    bio TEXT DEFAULT 'Tell us about yourself! Click Edit Profile to add your bio, tagline, and travel styles.',
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    styles TEXT[] DEFAULT '{}',
    gender TEXT,
    dob DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow individual users to update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. AUTOMATIC PROFILE TRIGGER (ON SIGN UP)
-- Creates a public profile entry whenever a user registers through Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar, gender, dob)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'New Traveler'),
        COALESCE(
            CASE 
                WHEN new.raw_user_meta_data->>'gender' = 'Female' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                WHEN new.raw_user_meta_data->>'gender' = 'Non-binary' OR new.raw_user_meta_data->>'gender' = 'Other' THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                ELSE 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
            END,
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
        ),
        new.raw_user_meta_data->>'gender',
        (new.raw_user_meta_data->>'dob')::DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. TRIPS TABLE
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    date TEXT NOT NULL, -- using text to support format: "Oct 15 - Oct 25"
    budget TEXT,
    description TEXT NOT NULL,
    image TEXT DEFAULT 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category TEXT NOT NULL CHECK (category IN ('Adventure', 'Culture', 'Relaxation', 'Hiking')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to trips" 
ON public.trips FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert trips" 
ON public.trips FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Allow hosts to update their own trips" 
ON public.trips FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Allow hosts to delete their own trips" 
ON public.trips FOR DELETE USING (auth.uid() = host_id);


-- 4. BUDDIES (CONNECTIONS) TABLE
CREATE TABLE public.buddies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'accepted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_buddy_pair UNIQUE (user_id_1, user_id_2),
    CONSTRAINT no_self_buddy CHECK (user_id_1 <> user_id_2)
);

ALTER TABLE public.buddies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" 
ON public.buddies FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create connections" 
ON public.buddies FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can update connection status" 
ON public.buddies FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);


-- 5. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('join_request', 'connect_request', 'request_accepted', 'connect_accepted')),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications sent to them or by them" 
ON public.notifications FOR SELECT USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can insert notifications" 
ON public.notifications FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received notifications (e.g. status or read status)" 
ON public.notifications FOR UPDATE USING (auth.uid() = receiver_id);


-- 6. CHATS TABLE
CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 7. CHAT PARTICIPANTS (JUNCTION TABLE)
CREATE TABLE public.chat_participants (
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, user_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chats they are in" 
ON public.chat_participants FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join/add participants" 
ON public.chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Access chats policy linked to participants
CREATE POLICY "Allow members of chat to read chat info" 
ON public.chats FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_id = id AND chat_participants.user_id = auth.uid()
));


-- 8. MESSAGES TABLE
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in their chats" 
ON public.messages FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_participants.chat_id = chat_id AND chat_participants.user_id = auth.uid()
));

CREATE POLICY "Users can send messages to their chats" 
ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE chat_participants.chat_id = chat_id AND chat_participants.user_id = auth.uid()
    )
);
