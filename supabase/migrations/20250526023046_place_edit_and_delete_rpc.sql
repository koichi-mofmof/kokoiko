-- リスト内の場所情報とタグを一括で編集するrpc
CREATE OR REPLACE FUNCTION update_list_place_and_tags(
  p_list_place_id uuid,
  p_visited_status visited_status_enum DEFAULT NULL,
  p_tags text[] DEFAULT NULL, -- タグ名配列
  p_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  tag_name text;
  v_tag_id uuid;
BEGIN
  -- list_placesの更新
  UPDATE list_places
  SET
    visited_status = COALESCE(p_visited_status, visited_status),
    updated_at = NOW()
  WHERE id = p_list_place_id;

  -- list_place_tagsの全削除
  DELETE FROM list_place_tags WHERE list_place_id = p_list_place_id;

  -- 新しいタグを挿入
  IF p_tags IS NOT NULL THEN
    FOREACH tag_name IN ARRAY p_tags
    LOOP
      IF TRIM(tag_name) = '' THEN
        CONTINUE;
      END IF;

      -- 既存タグを検索（ユーザーごと）
      SELECT id INTO v_tag_id FROM tags WHERE name = TRIM(tag_name) AND user_id = p_user_id;

      -- なければ新規作成
      IF v_tag_id IS NULL THEN
        INSERT INTO tags (name, user_id)
        VALUES (TRIM(tag_name), p_user_id)
        RETURNING id INTO v_tag_id;
      END IF;

      -- list_place_tagsに紐付け
      IF v_tag_id IS NOT NULL THEN
        INSERT INTO list_place_tags (list_place_id, tag_id, assigned_at)
        VALUES (p_list_place_id, v_tag_id, NOW())
        ON CONFLICT (list_place_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- リスト内の場所を削除し、関連タグ・コメントも削除するrpc
CREATE OR REPLACE FUNCTION delete_list_place_cascade(
  p_list_place_id uuid
)
RETURNS void AS $$
BEGIN
  -- コメント削除
  DELETE FROM list_place_commnts WHERE list_place_id = p_list_place_id;
  -- タグ削除
  DELETE FROM list_place_tags WHERE list_place_id = p_list_place_id;
  -- list_places本体削除
  DELETE FROM list_places WHERE id = p_list_place_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- list_placesテーブルからimage_urlカラムを削除
ALTER TABLE list_places DROP COLUMN IF EXISTS image_url;
