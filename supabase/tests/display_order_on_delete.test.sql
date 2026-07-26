-- 地点削除時に list_place_display_order の display_order が連番のまま保たれることを検証する。
-- 削除トリガーが行を消すだけで後続を詰めていなかったため、中間の地点を削除すると
-- 順序バッジが飛び番（1,2,4,5...）になる不具合があった。

BEGIN;
SELECT plan(6);

-- ---- フィクスチャ ----------------------------------------------------------
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000a01'::uuid, 'display-order-test@example.com');

-- auth.users への INSERT でプロフィール作成トリガーが走るため、重複は無視する
INSERT INTO public.profiles (id) VALUES ('00000000-0000-0000-0000-000000000a01'::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.place_lists (id, name, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000b01'::uuid,
  'display_order テスト',
  '00000000-0000-0000-0000-000000000a01'::uuid
);

INSERT INTO public.places (id, name) VALUES
  ('test-place-1', 'A'),
  ('test-place-2', 'B'),
  ('test-place-3', 'C'),
  ('test-place-4', 'D');

INSERT INTO public.list_places (list_id, place_id, user_id) VALUES
  ('00000000-0000-0000-0000-000000000b01'::uuid, 'test-place-1', '00000000-0000-0000-0000-000000000a01'::uuid),
  ('00000000-0000-0000-0000-000000000b01'::uuid, 'test-place-2', '00000000-0000-0000-0000-000000000a01'::uuid),
  ('00000000-0000-0000-0000-000000000b01'::uuid, 'test-place-3', '00000000-0000-0000-0000-000000000a01'::uuid),
  ('00000000-0000-0000-0000-000000000b01'::uuid, 'test-place-4', '00000000-0000-0000-0000-000000000a01'::uuid);

-- ---- 前提：登録トリガーが 1..4 を振る ---------------------------------------
SELECT results_eq(
  $$ SELECT display_order FROM public.list_place_display_order
     WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
     ORDER BY display_order $$,
  ARRAY[1, 2, 3, 4],
  '地点登録時に display_order が 1..4 で振られる'
);

-- ---- 中間の地点を削除 -------------------------------------------------------
DELETE FROM public.list_places
WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
  AND place_id = 'test-place-2';

-- 制約を DEFERRABLE にした場合、違反はコミット時まで検出されない。
-- テストはロールバックするため、ここで明示的に即時検査させる。
SET CONSTRAINTS ALL IMMEDIATE;

SELECT results_eq(
  $$ SELECT display_order FROM public.list_place_display_order
     WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
     ORDER BY display_order $$,
  ARRAY[1, 2, 3],
  '中間の地点を削除しても display_order が連番のまま詰められる'
);

SELECT results_eq(
  $$ SELECT place_id, display_order FROM public.list_place_display_order
     WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
     ORDER BY display_order $$,
  $$ VALUES ('test-place-1', 1), ('test-place-3', 2), ('test-place-4', 3) $$,
  '削除された地点より後ろの地点が 1 つずつ前へ詰まる'
);

-- ---- 先頭の地点を削除 -------------------------------------------------------
DELETE FROM public.list_places
WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
  AND place_id = 'test-place-1';

SET CONSTRAINTS ALL IMMEDIATE;

SELECT results_eq(
  $$ SELECT place_id, display_order FROM public.list_place_display_order
     WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
     ORDER BY display_order $$,
  $$ VALUES ('test-place-3', 1), ('test-place-4', 2) $$,
  '先頭の地点を削除しても 1 から始まる連番が保たれる'
);

-- ---- 末尾の地点を削除 -------------------------------------------------------
DELETE FROM public.list_places
WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
  AND place_id = 'test-place-4';

SET CONSTRAINTS ALL IMMEDIATE;

SELECT results_eq(
  $$ SELECT place_id, display_order FROM public.list_place_display_order
     WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
     ORDER BY display_order $$,
  $$ VALUES ('test-place-3', 1) $$,
  '末尾の地点を削除しても残りの順序は変わらない'
);

-- ---- 詰めたあとに地点を再追加 -----------------------------------------------
-- 登録トリガー（max+1）と削除トリガー（詰め）が噛み合うことを確認する
INSERT INTO public.list_places (list_id, place_id, user_id)
VALUES ('00000000-0000-0000-0000-000000000b01'::uuid, 'test-place-2', '00000000-0000-0000-0000-000000000a01'::uuid);

SET CONSTRAINTS ALL IMMEDIATE;

SELECT results_eq(
  $$ SELECT place_id, display_order FROM public.list_place_display_order
     WHERE list_id = '00000000-0000-0000-0000-000000000b01'::uuid
     ORDER BY display_order $$,
  $$ VALUES ('test-place-3', 1), ('test-place-2', 2) $$,
  '詰めたあとに地点を追加すると末尾（max+1）に入る'
);

SELECT * FROM finish();
ROLLBACK;
