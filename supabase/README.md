# Supabase セットアップガイド

このアプリケーションのSupabaseバックエンドをセットアップする手順です。

## 前提条件

- Supabase CLI がインストールされていること
- Supabaseプロジェクトが作成されていること

## 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

## 2. Supabaseプロジェクトにログイン

```bash
supabase login
```

## 3. プロジェクトのリンク

```bash
supabase link --project-ref fsaeuowdijoeqhnrqazx
```

## 4. データベースマイグレーションの適用

```bash
supabase db push
```

このコマンドで、以下のテーブルが作成されます：
- `users` - ユーザー情報
- `user_stamps` - スタンプ獲得履歴
- `user_rewards` - 特典交換履歴

## 5. Edge Functionsのデプロイ

すべてのEdge Functionsをデプロイします：

```bash
supabase functions deploy get-user-data
supabase functions deploy grant-stamp
supabase functions deploy get-percentile
supabase functions deploy submit-survey
supabase functions deploy claim-reward
```

または、一括でデプロイ：

```bash
supabase functions deploy
```

## 6. 環境変数の確認

Edge Functionsは以下の環境変数を自動的に使用します：
- `SUPABASE_URL` - プロジェクトURL
- `SUPABASE_SERVICE_ROLE_KEY` - サービスロールキー

これらはSupabaseによって自動的に提供されます。

## Edge Functions一覧

### get-user-data
ユーザー情報を取得、または新規作成します。

**リクエスト:**
```json
{
  "userId": "uuid-string"
}
```

**レスポンス:**
```json
{
  "user": {
    "id": "uuid",
    "user_number": 123,
    "registration_type": "anonymous",
    "survey_completed": false,
    "points": 5,
    "total_points": 5,
    "redeemable_points": 5
  },
  "progress": {
    "acquiredBooths": ["A", "B", "C"],
    "stamps": [...]
  }
}
```

### grant-stamp
ユーザーにスタンプを付与し、ポイントを加算します。

**リクエスト:**
```json
{
  "userId": "uuid-string",
  "stampId": "A"
}
```

**レスポンス:**
```json
{
  "success": true,
  "stampId": "A",
  "newTotalPoints": 6,
  "newRedeemablePoints": 6
}
```

### get-percentile
ユーザーのパーセンタイルを計算します。

**リクエスト:**
```json
{
  "userId": "uuid-string"
}
```

**レスポンス:**
```json
{
  "percentile": 85
}
```

### submit-survey
アンケートを提出し、ボーナスポイントを付与します。

**リクエスト:**
```json
{
  "userId": "uuid-string",
  "surveyData": {...}
}
```

**レスポンス:**
```json
{
  "success": true,
  "bonusPoints": 1,
  "newTotalPoints": 7,
  "newRedeemablePoints": 7
}
```

### claim-reward
特典を交換し、ポイントを消費します。

**リクエスト:**
```json
{
  "userId": "uuid-string",
  "rewardType": "normal",
  "pointsCost": 2
}
```

**レスポンス:**
```json
{
  "success": true,
  "rewardType": "normal",
  "pointsSpent": 2,
  "newRedeemablePoints": 5
}
```

## データベーススキーマ

### users テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | ユーザーID（クライアント生成） |
| user_number | INTEGER | 連番（自動採番） |
| registration_type | TEXT | 登録タイプ（anonymous） |
| points | INTEGER | ポイント（互換性用） |
| total_points | INTEGER | 累計獲得ポイント |
| redeemable_points | INTEGER | 交換可能ポイント |
| survey_completed | BOOLEAN | アンケート完了フラグ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### user_stamps テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | レコードID |
| user_id | UUID | ユーザーID |
| stamp_id | TEXT | スタンプID（A, B, Cなど） |
| acquired_at | TIMESTAMP | 獲得日時 |

### user_rewards テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | レコードID |
| user_id | UUID | ユーザーID |
| reward_type | TEXT | 特典タイプ |
| points_spent | INTEGER | 消費ポイント |
| redeemed_at | TIMESTAMP | 交換日時 |

## トラブルシューティング

### マイグレーションエラー
マイグレーションでエラーが発生した場合：

```bash
# マイグレーションのリセット
supabase db reset

# 再度マイグレーションを適用
supabase db push
```

### Edge Functionのログ確認
```bash
supabase functions logs get-user-data
```

### ローカル開発
```bash
# Supabaseをローカルで起動
supabase start

# ローカルでEdge Functionをテスト
supabase functions serve get-user-data
```

## セキュリティ

- Row Level Security (RLS) が有効化されています
- 匿名ユーザーは全ユーザーの情報を読み取れます（パーセンタイル計算のため）
- 書き込みはサービスロールキー経由のみ許可されています
