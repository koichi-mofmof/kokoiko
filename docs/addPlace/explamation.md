次の要件で、Google Maps API（Autocomplete + Place Details）を使った地点登録 UI を実装してください。

【UI 構成】

- 地点名入力用の`TextField`と「検索」ボタンを横並びに表示する。
- 「検索」ボタンをクリック、または Enter キー押下時に Autocomplete API で候補を取得する。
- 候補はリスト表示し、ユーザーが 1 つ選択できる。
- 候補選択後、Place Details API を使って選択地点の詳細（住所や座標）を取得し、登録処理に渡す。
- 選択した地点情報（名前、住所）を下部に表示する。
- Place Details API を使って選択地点の詳細を取得後、タグやメモを入力できるようにする。（list_places テーブル、list_place_tags に対応。 @table_design_explanation.md を参照）

【注意点・工夫】

- ## Google Maps API は 2025 年に大幅なアップデートがされています。最新の公式ドキュメントを参照してください。
- 文字入力ごとに API が呼ばれないよう、検索ボタン押下時にだけ Autocomplete リクエストを行う。
- 無効な検索やエラー時のフィードバック（例：スニペット表示やトースト）も用意する。
- エンターキーでの検索にも対応する。
- ローディング中のスピナーやメッセージを表示して UX を維持する。
- UI は shadcn ui の使いやすいコンポーネントライブラリを使ってもよい。
- PC だけでなくスマートフォンでの利用を想定した UI とする。
- Autocomplete と Place Details は同じセッションキーでまとめること。
