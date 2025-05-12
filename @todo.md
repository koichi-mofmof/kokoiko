# ココイコ TODO

## 🔴 緊急タスク

- [x] Next.js プロジェクトへの完全移行
  - [x] Vite 関連ファイルの削除
  - [x] Next.js 設定ファイルの作成
  - [x] srcd ディレクトリからのコンポーネント移行
    - [x] 型定義の移行 (types/)
    - [x] モックデータの移行 (lib/data/)
    - [x] Link コンポーネントの移行 (app/components/common/)
    - [x] ShareModal コンポーネントの移行 (app/components/share/)
    - [x] PlaceCard コンポーネントの移行 (app/components/places/)
    - [x] MapView コンポーネントの移行 (app/components/map/)
    - [x] FilterBar コンポーネントの移行 (app/components/places/)
    - [x] ViewToggle コンポーネントの移行 (app/components/places/)
    - [x] PlaceList コンポーネントの移行 (app/components/places/)
    - [x] SpotSearch コンポーネントの移行 (app/components/search/)
    - [x] AddPlaceForm コンポーネントの移行 (app/components/forms/)
    - [x] Header コンポーネントの移行 (app/components/ui/)
  - [x] 不要なファイルの整理

## 🟡 重要タスク

- [ ] データベース設計
  - [ ] スキーマ設計
  - [ ] Supabase のセットアップ
- [ ] 認証機能の実装
  - [ ] ログイン/登録フォーム (基本実装)
  - [ ] Supabase Auth の連携 (ssr, actions)
- [ ] 場所登録機能
  - [ ] 登録フォーム
  - [ ] 地図表示
  - [ ] タグ付け機能
- [ ] 場所編集機能
  - [ ] 編集画面へのリンク追加 (PlaceCard, PlaceList)
  - [ ] 編集ページルート作成 (`/places/[id]/edit`)
  - [ ] 編集フォームコンポーネント作成 (基本)
  - [ ] Server Action での更新処理実装
  - [ ] フォームバリデーション (Zod)
  - [ ] フォームと Server Action の接続 (useFormState, useFormStatus)
- [~] 行きたい場所リストのランキング機能実装 # 新規追加・進行中
  - [x] ランキングデータ構造の定義 (PlaceListGroup, RankedPlace)
  - [x] ランキング表示 UI コンポーネント作成 (RankingView, RankingDisplay, RankingCard)
  - [x] ランキング編集モーダル UI コンポーネント作成 (RankingEditModal)
  - [x] ランキング更新用 Server Action 作成 (updateRankingAction)
  - [ ] ランキング編集モーダルでのドラッグ＆ドロップによる順位変更機能
  - [ ] Supabase とのデータ連携 (ランキング情報の永続化)
  - [x] リスト詳細ページへのランキングビュータブ/切り替え UI の追加

## 🟢 通常タスク

- [~] UI/UX の改善 # ステータスを進行中に変更
  - [x] MapPage / SampleMapPage のビュー切り替え機能実装 # 追加
  - [x] MapPage / SampleMapPage の FilterBar 実装とレイアウト調整 # 追加
  - [x] リスト詳細ページに参加者アバターを表示 (sharedUserIds 使用) # タスク名修正
  - [x] スマートフォン表示でマップピン選択時のカードの閉じるボタンが隠れる問題を修正
  - [x] スマートフォン表示でマップピン選択時の PlaceCard のサイズを調整
  - [x] RankingEditModal の UI デザイン調整 (テキストカラー、背景色、ボタン等)
  - [ ] モバイル対応 (継続的な改善) # 詳細化
  - [ ] ダークモード対応
  - [ ] ランキング表示 (RankingCard) のデザイン調整 (SNS 映えなど) # 新規追加
  - [ ] エラーメッセージのトースト通知化 (ランキング編集モーダルなど) # 新規追加
- [ ] グループ共有機能
  - [ ] グループ作成
  - [ ] 招待機能
- [~] フィルタリング機能 # ステータスを進行中に変更
  - [ ] 場所の検索 (SpotSearch 連携) # 詳細化
  - [x] タグによるフィルタリング # ステータスを完了に変更
  - [x] 訪問ステータスによるフィルタリング # 追加・完了
  - [x] リスト一覧画面に検索ボックスを追加し、リスト名で検索できるようにする # 新規追加・完了
  - [ ] リスト一覧での共有ユーザー表示
    - [ ] サーバーコンポーネントでリストごとの共有ユーザー情報を取得
    - [ ] 取得したデータをアバター UI に反映
  - [ ] リスト詳細ページでの実際の参加者データ連携 # 追加

## ⚪ 低優先タスク

- [ ] ソーシャル共有機能
- [ ] 通知機能
- [ ] エクスポート/インポート機能
