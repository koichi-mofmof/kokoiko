-- list_share_tokens.created_by に default auth.uid() を設定
ALTER TABLE list_share_tokens
ALTER COLUMN created_by SET DEFAULT auth.uid(); 