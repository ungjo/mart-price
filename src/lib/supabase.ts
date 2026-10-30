import { PriceDataError } from '../features/prices/data-error';
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../features/prices/database-types';

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;
  // Expo는 EXPO_PUBLIC_*를 앱 번들에 넣는다. 공개 키만 사용하고 관리자 키는 거부한다.
  // process.env를 동적으로 탐색하면 Expo가 값을 치환하지 못하므로 속성을 직접 읽는다.
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new PriceDataError('데이터 연결 설정이 필요해요.');
  if (!key.startsWith('sb_publishable_')) throw new PriceDataError('앱에 사용할 공개 연결 키를 확인해 주세요.');
  let projectUrl: URL;
  try { projectUrl = new URL(url); } catch { throw new PriceDataError('데이터 연결 주소를 확인해 주세요.'); }
  if (projectUrl.protocol !== 'https:' || projectUrl.username || projectUrl.password
    || projectUrl.search || projectUrl.hash || !['', '/'].includes(projectUrl.pathname)) {
    throw new PriceDataError('데이터 연결 주소를 확인해 주세요.');
  }
  client = createClient<Database>(url, key, {
    // 현재는 공개 카탈로그 조회만 사용한다. 로그인 세션 저장이나 갱신용 저장소는 필요하지 않다.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
