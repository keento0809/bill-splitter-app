# テスト構造

このディレクトリには、プロジェクトの全テストが整理されて配置されています。

## 📁 ディレクトリ構造

```
src/tests/
├── setup.ts         # テストセットアップファイル
├── units/           # ユニットテスト
│   ├── components/  # コンポーネントの単体テスト
│   ├── services/    # サービス層の単体テスト
│   └── utils/       # ユーティリティ関数の単体テスト
├── integration/     # 統合テスト
│   └── components/  # コンポーネント間の連携テスト
└── e2e/            # エンドツーエンドテスト
    └── *.spec.ts   # Playwrightによるブラウザテスト
```

## 🧪 テストの種類

### Unit Tests（ユニットテスト）
- **目的**: 個々のコンポーネントや関数の動作検証
- **フレームワーク**: Vitest + React Testing Library
- **実行**: `npm run test:units`

**対象:**
- Reactコンポーネント（Button, Input, Modal）
- ユーティリティ関数（helpers, calculation, memo）
- サービス層（storage）

### Integration Tests（統合テスト）
- **目的**: 複数のコンポーネント間の連携動作検証
- **フレームワーク**: Vitest + React Testing Library
- **実行**: `npm run test:integration`

**対象:**
- メンバー管理機能（追加・編集・無効化・削除）
- 支払い管理機能（追加・編集・削除）
- データフローと状態管理

### End-to-End Tests（E2Eテスト）
- **目的**: 実際のブラウザでのユーザージャーニー検証
- **フレームワーク**: Playwright
- **実行**: `npm run test:e2e`

**対象:**
- 完全な割り勘フロー
- グループ作成・参加
- URL共有機能
- レスポンシブ対応

## 🏃‍♂️ テスト実行方法

```bash
# 全テスト実行
npm run test:all

# ユニットテストのみ
npm run test:units

# 統合テストのみ
npm run test:integration

# E2Eテストのみ
npm run test:e2e

# E2EテストをUIモードで実行
npm run test:e2e:ui

# ウォッチモード（開発時）
npm run test
```

## 📊 テストカバレッジ

### 現在のカバレッジ
- **ユニットテスト**: 135テスト（100%成功）
- **統合テスト**: 実装済み（メンバー・支払い管理）
- **E2Eテスト**: 17シナリオ（100%成功）

### カバー範囲
- ✅ コアビジネスロジック（割り勘計算）
- ✅ UI コンポーネント
- ✅ データ永続化（LocalStorage）
- ✅ ユーザーインタラクション
- ✅ エラーハンドリング

## 🔧 テスト設定

### Vitest設定
- **設定ファイル**: `vite.config.ts`
- **セットアップ**: `src/tests/setup.ts`
- **環境**: jsdom
- **対象**: `src/tests/units/**/*` + `src/tests/integration/**/*`

### Playwright設定
- **設定ファイル**: `playwright.config.ts`
- **対象**: `src/tests/e2e/**/*`
- **ブラウザ**: Chromium
- **開発サーバー**: 自動起動（localhost:5173）

## 📝 テスト作成ガイドライン

### ファイル命名規則
- ユニットテスト: `ComponentName.test.tsx` / `functionName.test.ts`
- 統合テスト: `FeatureName.integration.test.tsx`
- E2Eテスト: `feature-name.spec.ts`

### TDD原則
1. ❌ **Red**: 失敗するテストを先に作成
2. ✅ **Green**: テストが通るまで実装
3. 🔄 **Refactor**: コード品質向上

### 型安全性
- 🚫 `any` 型の使用禁止
- 🚫 `never` 型の使用禁止
- ✅ 適切な型アノテーションの使用