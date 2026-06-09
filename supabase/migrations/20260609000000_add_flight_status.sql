-- supabase/migrations/20260609000000_add_flight_status.sql
-- 搭乗便のステータスを追加。
--   confirmed = 搭乗確定（予約済み・搭乗済み） … 確定PPとして目標達成にカウント
--   tentative = 未予約（まだ予約していない予定便） … 見込みPPとして別枠集計
alter table public.flights
    add column if not exists status text not null default 'confirmed'
    check (status in ('confirmed', 'tentative'));

-- 既存の登録済みフライトはすべて実績/予約済みとして 'confirmed' 扱い（default で充足）。

create index if not exists flights_user_status_idx on public.flights (user_id, status);
