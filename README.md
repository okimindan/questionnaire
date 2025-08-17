# Questionnaire要件定義書

- アドレス
  ```
  http://test.okimi-public.xyz/
  ```
- ファイル情報
  ```
  okimi/
  ├─ public/
  │  ├─ index.html     ← 既存（そのまま / 1行だけ追記）
  │  ├─ js/app.js      ← 既存（fetchでAPIにPOSTするよう差し替え）
  │  └─ css/style.css  ← 既存
  ├─ server.js         ← 追加（APIサーバ）
  └─ .env              ← 追加（DB接続情報：別サーバ）
  ```

## 1. Overview
EC2でアンケートシステムを作成し、その結果を保存し分析

## 2. Purpose
- 勉強目的

## 3. System Overview（システム構成図（概要））
```
Windows Server からURLでアンケートシステムに接続
↓
Webサーバが応答
```
![画像](https://github.com/okimindan/questionnaire/blob/main/questionnaire.drawio.png)
## 4. Scope（スコープ）

### 4.1 Scope（対象）
- 東京リージョン（ap-northeast-1）上のEC2 インスタンス
- EC2タグ Role=monitoring-target

### 4.2 Out of Scope （非対象）
- EC2 以外のリソース（RDS、S3 など）

## 5. 	Functional Requirements（機能要件）

| No. | 機能名 | 内容 |
|-----|--------|------|
| 1   | 定期実行 | EventBridge を23:00（JST）に実行 |
| 2   | EC2 状態取得 | Lambda で EC2 の一覧を取得し、起動中のインスタンスを確認 |
| 3   | 起動時間の判定 | 起動から一定時間経過（例：8時間以上）のインスタンスを検出 |
| 4   | 通知処理 | SNS 経由でメール通知<br>　EC2なし→NO EC2 instance<br>　EC2あり→インスタンス名 |
| 5   | ログ出力 | Lambda は CloudWatch Logs に実行ログを出力すること |

## 6. Non-functional Requirements（非機能要件）

- Lambda は Python 3.12 を使用
- 処理時間は最大で10秒以内（インスタンス数が多くても対応できるように設計）
- Lambda は失敗時 CloudWatch Logs にエラーログを出力する
- IAM ポリシーはadministrator権限

- databases→`profile_app `

## 7. Services Used （使用サービス）

- Amazon EC2
- AWS Lambda
- Amazon EventBridge（スケジュール実行）
- Amazon SNS（メール通知）
- CloudWatch Logs（ログ確認）

## 8. IAM Roles and Policy Requirements（IAM ロール／ポリシー要件）

| ロール名 | 使用サービス | 必要な権限 |
|----------|--------------|------------|
| Lambda_AdministratorAccess | Lambda | `AdministratorAccess` |
| Eventbridge_AdministratorAccess | EventBridge | `AdministratorAccess` |



## 9. Future Enhancements (Optional)(将来的な拡張（参考）)

- CloudFormationを利用したEC2作成（タグ Role=monitoring-target）




