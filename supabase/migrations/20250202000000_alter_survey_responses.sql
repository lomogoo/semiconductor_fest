-- Alter survey_responses table to new schema
-- 既存のテーブルを新しいアンケート構造に対応させる

-- まず、既存データがある場合は削除するか、バックアップを取ってください
-- TRUNCATE survey_responses; -- 全データ削除する場合（注意！）

-- 不要なカラムを削除（データが残っていても構わない場合はコメントアウト）
ALTER TABLE survey_responses DROP COLUMN IF EXISTS event_source;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS feedback;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS research_interests;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS career_interests;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS good_contents;

-- 新しいカラムを追加
-- Q2: 性別
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS gender TEXT;

-- Q3: 参加したきっかけ
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS participation_trigger TEXT;

-- Q4: 参加した感想
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS satisfaction TEXT;

-- Q5: 良かった企画 (複数回答可)
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS good_programs TEXT[] DEFAULT '{}';

-- Q6: 知らなかった企業 (複数回答可)
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS unknown_companies TEXT[] DEFAULT '{}';

-- Q7: 良かった企業 (複数回答可)
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS good_companies TEXT[] DEFAULT '{}';

-- Q8: 働いてみたい企業 (複数回答可)
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS desired_companies TEXT[] DEFAULT '{}';

-- Q9: 働きたい理由 (任意、複数回答可)
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS work_reasons TEXT[] DEFAULT '{}';
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS work_reasons_other TEXT;

-- Q10: その他感想 (任意)
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS other_feedback TEXT;

-- 必須項目にNOT NULL制約を追加（既存データがない場合のみ）
-- 既存データがある場合は、まずデフォルト値を設定してから制約を追加
-- ALTER TABLE survey_responses ALTER COLUMN gender SET NOT NULL;
-- ALTER TABLE survey_responses ALTER COLUMN participation_trigger SET NOT NULL;
-- ALTER TABLE survey_responses ALTER COLUMN satisfaction SET NOT NULL;

-- コメント: 既存データがある場合は、以下の手順を推奨します：
-- 1. まず全データをエクスポート
-- 2. テーブルをTRUNCATE
-- 3. このマイグレーションを実行
-- 4. 必要であればNOT NULL制約を追加
