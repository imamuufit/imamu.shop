# imamu. STORE

トレーニングと暮らしを整える、imamu.公式セレクト。

## ファイル構成

- `index.html`: 商品一覧と詳細モーダル
- `products.json`: 商品データとストア設定
- `styles.css`: 画面デザイン
- `app.js`: JSON読み込み、絞り込み、詳細モーダル
- `legal.html`: 特定商取引法に基づく表記
- `returns.html`: 返品・交換ポリシー
- `assets/`: 商品画像とアイコン

## 商品追加

`products.json` の `products` 配列に商品を追加します。

主な項目:

- `id`: 商品ごとの一意なID
- `name`: 商品名
- `category`: カテゴリ名
- `price`: 税込価格
- `stockStatus`: `in_stock`、`low_stock`、`sold_out`、`pre_order`、`ticket`
- `stockLabel`: 画面に表示する在庫ステータス
- `image`: 商品画像のパス
- `shortDescription`: カードに表示する短い説明
- `description`: 詳細モーダルの商品説明
- `recommendedFor`: おすすめの方
- `usage`: 使用目安
- `notes`: 注意事項
- `isSupplement`: サプリメントの場合は `true`
- `paymentUrl`: Stripe Payment Links や Squareリンク決済などの外部URL

`lineReserveUrl` は `store` または商品ごとに設定できます。URL内に `{message}` を入れると、商品名と価格を含むメッセージに置き換わります。

## 公開前チェック

- `products.json` の `example.com` 決済URLを本番URLに差し替える
- `store.lineReserveUrl` を実際のLINE公式アカウントURLに差し替える
- `legal.html` の「要入力」を正式情報に差し替える
- サプリメント表現が医薬品的な効能効果になっていないか確認する
