import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://watjwfadgbszrpninufb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iDAMr3N7LEvoSdtV1MgNeA_r5w4RxiY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
