-- フェーズ1: 緊急対応 - 循環参照ポリシーの削除
-- 目的: infinite recursion detected エラーの解消
-- 対象: shared_lists ↔ list_share_tokens 間の循環参照

-- 1. shared_lists の循環参照ポリシーを削除
DROP POLICY IF EXISTS "shared_lists_collaborator_insert" ON shared_lists;
DROP POLICY IF EXISTS "shared_lists_collaborator_update" ON shared_lists;

-- 2. list_share_tokens の循環参照ポリシーを削除  
DROP POLICY IF EXISTS "list_share_tokens_editor_select" ON list_share_tokens;
DROP POLICY IF EXISTS "list_share_tokens_editor_insert" ON list_share_tokens;
DROP POLICY IF EXISTS "list_share_tokens_editor_update" ON list_share_tokens;
DROP POLICY IF EXISTS "list_share_tokens_editor_delete" ON list_share_tokens;


