# Photo Upload App

管理者が生成した共有リンク経由で、利用者がスマホで撮影した写真を安全にアップロードできるWebアプリです。

## 技術スタック

- **フレームワーク**: Next.js 14（App Router / TypeScript）
- **スタイリング**: Tailwind CSS
- **ストレージ・DB**: Supabase（Storage + PostgreSQL）
- **デプロイ**: Vercel

---

## セットアップ手順

### 1. Supabaseプロジェクトのセットアップ

1. [supabase.com](https://supabase.com) でアカウントを作成し、新しいプロジェクトを作成します。
2. プロジェクトの **Settings → API** から以下の値を控えておきます：
   - `Project URL`
   - `anon` キー（`public`）
   - `service_role` キー（**秘密鍵。外部に漏らさないこと**）

### 2. Storageバケットの作成

1. Supabaseダッシュボードの **Storage** を開きます。
2. **New bucket** をクリックします。
3. バケット名を `photos` と入力します。
4. **Public bucket** のチェックを **外した状態**（Private）で作成します。

### 3. テーブルの作成

Supabaseダッシュボードの **SQL Editor** を開き、以下のSQLを実行します：

```sql
-- 管理者セッション
create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  is_used boolean default false
);

-- アップロードセッション（共有リンク）
create table upload_sessions (
  id uuid primary key default gen_random_uuid(),
  folder_name text not null,
  token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  is_used boolean default false
);
```

### 4. ローカル開発環境の起動

```bash
# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して各値を入力

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 5. 環境変数の設定

`.env.local` に以下を設定します：

```env
ADMIN_PASSPHRASE=your-strong-passphrase-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Vercelへのデプロイ

1. GitHubにリポジトリをプッシュします。
2. [vercel.com](https://vercel.com) でプロジェクトをインポートします。
3. **Environment Variables** に以下を設定します：
   - `ADMIN_PASSPHRASE`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_BASE_URL`（例: `https://your-app.vercel.app`）
4. デプロイします。

---

## 使い方

### 管理者フロー

1. `/login` にアクセスしてパスフレーズを入力します。
2. 生成されたマジックリンクをコピーするか、「管理画面を開く」をクリックします。
3. `/admin` でフォルダ名を入力して「リンク生成」を押します。
4. 表示されたURL・QRコードを利用者にSMS/LINE等で共有します。

### 利用者フロー

1. 受け取ったリンクをスマホでタップします。
2. 「写真を選択 / 撮影」をタップしてカメラを起動するか、フォトライブラリから選択します。
3. プレビューを確認し、不要な写真は削除できます。
4. 「アップロードする」をタップして送信します。
5. 完了画面が表示されたら送信完了です。

### 管理者の写真確認・ダウンロード

1. `/admin` のフォルダ一覧からフォルダをクリックします。
2. 写真をクリックして個別ダウンロード、または「ZIP一括ダウンロード」でまとめてダウンロードできます。

---

## セキュリティ仕様

- `ADMIN_PASSPHRASE` は環境変数のみで管理（コードへのハードコード禁止）
- アップロード許可MIMEタイプ: `image/jpeg`, `image/png`, `image/heic`, `image/heif`
- ファイルサイズ上限: 1ファイル 20MB / 1リクエスト最大10枚
- ファイル名は `{timestamp}_{uuid}.{ext}` 形式にリネーム（元のファイル名は使用しない）
- Supabase StorageはPrivateバケット（署名付きURLでのみアクセス可）
- アップロードトークンは1回限り有効（`is_used`フラグ管理）
- 管理者セッションCookieは `httpOnly: true`, `secure: true`, `sameSite: strict` で設定
