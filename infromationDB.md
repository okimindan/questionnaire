# DB
```
-- データベースがなければ作成
CREATE DATABASE IF NOT EXISTS questionnaire
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- このデータベースを使用
USE questionnaire;

-- プロファイルテーブルを作成（既にあればスキップ）
CREATE TABLE IF NOT EXISTS profiles (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,
  age        TINYINT UNSIGNED NULL,
  gender     ENUM('男性','女性','その他','回答しない') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_profiles_gender (gender)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

```
