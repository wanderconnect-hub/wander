-- ==========================================
-- WanderConnect Supabase Database Schema
-- ==========================================

-- 1. PROFILES TABLE
-- Links with Supabase Auth users automatically
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    title TEXT DEFAULT 'New Traveler',
    bio TEXT DEFAULT 'Tell us about yourself! Click Edit Profile to add your bio, tagline, and travel styles.',
    avatar TEXT DEFAULT 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23E0F2FE" stroke="%230284C7" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%230284C7" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="16" fill="%23FDBA74" /><circle cx="33" cy="38" r="4" fill="%23FDBA74" /><circle cx="67" cy="38" r="4" fill="%23FDBA74" /><path d="M32 38 C32 22 68 22 68 38 C62 30 38 30 32 38 Z" fill="%231E293B" /><path d="M34 30 L38 24 L44 28 L50 22 L56 28 L62 24 L66 30 Z" fill="%231E293B" /></svg>',
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
    INSERT INTO public.profiles (id, name, email, avatar, gender, dob)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'New Traveler'),
        new.email,
        COALESCE(
            CASE 
                WHEN new.raw_user_meta_data->>'gender' = 'Female' THEN 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23FCE7F3" stroke="%23DB2777" stroke-width="2"/><path d="M30 38 C30 20 70 20 70 38 C70 55 66 65 66 65 H34 C34 65 30 55 30 38 Z" fill="%23475569" /><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%23DB2777" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="15" fill="%23FDBA74" /><path d="M33 34 C33 24 67 24 67 34 C60 28 40 28 33 34 Z" fill="%23475569" /><path d="M33 34 C35 38 42 36 45 32 C48 36 55 38 67 34 Z" fill="%23475569" /></svg>'
                WHEN new.raw_user_meta_data->>'gender' = 'Non-binary' OR new.raw_user_meta_data->>'gender' = 'Other' THEN 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23F3E8FF" stroke="%237C3AED" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%237C3AED" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="15.5" fill="%23FDBA74" /><path d="M33 34 C33 22 67 22 67 34 C63 28 37 28 33 34 Z" fill="%231E293B" /></svg>'
                ELSE 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23E0F2FE" stroke="%230284C7" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%230284C7" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="16" fill="%23FDBA74" /><circle cx="33" cy="38" r="4" fill="%23FDBA74" /><circle cx="67" cy="38" r="4" fill="%23FDBA74" /><path d="M32 38 C32 22 68 22 68 38 C62 30 38 30 32 38 Z" fill="%231E293B" /><path d="M34 30 L38 24 L44 28 L50 22 L56 28 L62 24 L66 30 Z" fill="%231E293B" /></svg>'
            END,
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23E0F2FE" stroke="%230284C7" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%230284C7" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="16" fill="%23FDBA74" /><circle cx="33" cy="38" r="4" fill="%23FDBA74" /><circle cx="67" cy="38" r="4" fill="%23FDBA74" /><path d="M32 38 C32 22 68 22 68 38 C62 30 38 30 32 38 Z" fill="%231E293B" /><path d="M34 30 L38 24 L44 28 L50 22 L56 28 L62 24 L66 30 Z" fill="%231E293B" /></svg>'
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
ON public.chat_participants FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join/add participants" 
ON public.chat_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow members of chat to read chat info" 
ON public.chats FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE chat_participants.chat_id = id AND chat_participants.user_id = auth.uid()
    ) OR 
    NOT EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE chat_participants.chat_id = id
    )
);

CREATE POLICY "Allow authenticated users to create chats" 
ON public.chats FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);



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
