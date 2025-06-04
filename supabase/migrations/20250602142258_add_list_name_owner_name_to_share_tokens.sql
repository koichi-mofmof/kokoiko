ALTER TABLE list_share_tokens ADD COLUMN list_name text;
ALTER TABLE list_share_tokens ADD COLUMN owner_name text;

ALTER TABLE list_share_tokens ADD COLUMN owner_id uuid not null;
ALTER TABLE list_share_tokens
ADD CONSTRAINT fk_list_share_tokens_owner
FOREIGN KEY (owner_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE shared_lists ADD COLUMN owner_id uuid not null;
ALTER TABLE shared_lists
ADD CONSTRAINT fk_shared_lists_owner
FOREIGN KEY (owner_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 共有されているユーザーは自身の共有設定を閲覧可能（削除はオーナーのみ可能とする例）
DROP POLICY IF EXISTS "Allow shared users to view their share" ON shared_lists;
CREATE POLICY "Allow shared users to view their share" ON shared_lists FOR SELECT USING (
    shared_lists.shared_with_user_id = auth.uid()
    or shared_lists.owner_id = auth.uid()
);