# 地点追加 UI（Google Maps API 連携）実装 ToDo リスト

- [x] Google Maps API（Autocomplete/Place Details）の最新仕様調査 🟢
  - 2025 年以降のセッション管理・推奨実装パターンを整理
- [x] UI 設計（shadcn/ui ベース、スマホ対応）🟡
  - TextField, Button, 候補リスト, スピナー, トースト等
- [x] sessiontoken 生成（UUID v4）ロジック実装 🟢
- [x] Autocomplete API 連携（検索ボタン/Enter で発火）🟡
- [x] 候補リスト表示・選択 UI 実装 🟡
- [x] Place Details API 連携（候補選択時）🟡
  - sessiontoken を必ず渡す
- [x] 選択地点情報（名前・住所）表示 🟢
- [x] タグ・メモ入力欄 UI 追加（list_places, list_place_tags 対応）🟡
- [x] Supabase 登録処理（places, list_places, list_place_tags）🟡
- [x] エラー・ローディング・UX フィードバック実装（スピナー・トースト等）🟡
- [x] スマホ対応 UI 調整 🟢
- [x] 型安全性・API キー管理・セキュリティ確認 🟡
- [x] テスト・動作検証・バグ修正 🟢
- [x] コード整理・リファクタリング・コメント追加 ⚪

---

- 🟢 通常　 🟡 重要　 🔴 緊急　 ⚪ 低優先
- [ ] 未着手　[~] 進行中　[x] 完了

---
