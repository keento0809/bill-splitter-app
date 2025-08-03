import { test, expect } from '@playwright/test';

test.describe('割り勘アプリ E2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ホームページの基本表示', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('割り勘アプリ');
    await expect(page.getByTestId('create-group-name-input')).toBeVisible();
    await expect(page.getByTestId('create-group-button')).toBeVisible();
  });

  test('新規グループ作成フロー', async ({ page }) => {
    // グループ名入力
    await page.getByTestId('create-group-name-input').fill('テスト旅行');
    
    // グループ作成ボタンクリック
    await page.getByTestId('create-group-button').click();
    
    // グループページに遷移
    await expect(page).toHaveURL(/\/group\/[a-z0-9]+/);
    await expect(page.getByTestId('group-name')).toContainText('テスト旅行');
  });

  test('完全な割り勘フロー', async ({ page }) => {
    // 1. グループ作成
    await page.getByTestId('create-group-name-input').fill('沖縄旅行');
    await page.getByTestId('create-group-button').click();
    
    // 2. メンバー追加（メンバーがいないため自動的にモーダルが開く）
    await page.waitForSelector('[data-testid="member-management-modal"]');
    
    await page.getByTestId('add-member-input').fill('Alice');
    await page.getByTestId('add-member-button').click();
    
    await page.getByTestId('add-member-input').fill('Bob');
    await page.getByTestId('add-member-button').click();
    
    await page.getByTestId('add-member-input').fill('Charlie');
    await page.getByTestId('add-member-button').click();
    
    // メンバー管理モーダルを閉じる
    await page.keyboard.press('Escape');
    
    // メンバーが追加されたことを確認
    await expect(page.locator('text=メンバー (3人)')).toBeVisible();
    
    // 3. 支払い追加
    await page.getByTestId('add-payment-button').click();
    
    // 支払いフォームの入力
    await page.getByTestId('payment-amount-input').fill('3000');
    await page.getByTestId('payment-description-input').fill('ホテル代');
    await page.getByTestId('payment-payer-select').selectOption({ label: 'Alice' });
    
    // 全員を参加者に選択
    await page.getByTestId('select-all-participants').click();
    
    // 支払い保存
    await page.getByTestId('save-payment-button').click();
    
    // 4. 2つ目の支払い追加
    await page.getByTestId('add-payment-button').click();
    
    await page.getByTestId('payment-amount-input').fill('1500');
    await page.getByTestId('payment-description-input').fill('食事代');
    await page.getByTestId('payment-payer-select').selectOption({ label: 'Bob' });
    await page.getByTestId('select-all-participants').click();
    await page.getByTestId('save-payment-button').click();
    
    // 5. 清算結果の確認
    await expect(page.getByTestId('total-amount')).toContainText('4,500');
    await expect(page.getByTestId('per-person-amount')).toContainText('1,500');
    
    // 清算取引が表示されることを確認
    const settlements = page.locator('[data-testid^="settlement-"]');
    await expect(settlements).not.toHaveCount(0);
  });

  test('メンバー管理機能', async ({ page }) => {
    // グループ作成
    await page.getByTestId('create-group-name-input').fill('テストグループ');
    await page.getByTestId('create-group-button').click();
    
    // メンバー管理モーダルが自動的に開くまで待機
    await page.waitForSelector('[data-testid="member-management-modal"]');
    
    // メンバー追加
    await page.getByTestId('add-member-input').fill('テストユーザー');
    await page.getByTestId('add-member-button').click();
    
    // メンバーが表示されることを確認
    await expect(page.locator('[data-testid^="member-item-"]').getByText('テストユーザー')).toBeVisible();
    
    // メンバー編集
    const memberItem = page.locator('[data-testid^="member-item-"]').first();
    await memberItem.getByTestId(/edit-member-/).click();
    
    await page.getByTestId('edit-member-name-input').fill('編集済みユーザー');
    await page.getByTestId('save-edit-button').click();
    
    // 編集が反映されることを確認
    await expect(page.locator('[data-testid^="member-item-"]').getByText('編集済みユーザー')).toBeVisible();
  });

  test('支払い編集・削除機能', async ({ page }) => {
    // グループ作成とメンバー追加
    await page.getByTestId('create-group-name-input').fill('テストグループ');
    await page.getByTestId('create-group-button').click();
    
    // メンバー管理モーダルが自動的に開くまで待機
    await page.waitForSelector('[data-testid="member-management-modal"]');
    
    await page.getByTestId('add-member-input').fill('Alice');
    await page.getByTestId('add-member-button').click();
    
    await page.getByTestId('add-member-input').fill('Bob');
    await page.getByTestId('add-member-button').click();
    
    // メンバー管理モーダルを閉じる
    await page.keyboard.press('Escape');
    
    // 支払い追加
    await page.getByTestId('add-payment-button').click();
    await page.getByTestId('payment-amount-input').fill('1000');
    await page.getByTestId('payment-description-input').fill('テスト支払い');
    await page.getByTestId('payment-payer-select').selectOption({ label: 'Alice' });
    await page.getByTestId('select-all-participants').click();
    await page.getByTestId('save-payment-button').click();
    
    // 支払いが追加されることを確認
    await expect(page.locator('text=テスト支払い')).toBeVisible();
    
    // 支払い編集
    const paymentItem = page.locator('[data-testid^="payment-item-"]').first();
    await paymentItem.getByTestId(/edit-payment-/).click();
    
    await page.getByTestId('payment-description-input').fill('編集済み支払い');
    await page.getByTestId('save-payment-button').click();
    
    // 編集が反映されることを確認
    await expect(page.locator('text=編集済み支払い')).toBeVisible();
    
    // 支払い削除
    await paymentItem.getByTestId(/remove-payment-/).click();
    
    // 支払いが削除されることを確認
    await expect(page.locator('text=編集済み支払い')).not.toBeVisible();
    await expect(page.getByTestId('no-payments-message')).toBeVisible();
  });


  test('URL共有機能', async ({ page, context }) => {
    // Clipboard APIの権限を許可
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // グループ作成
    await page.getByTestId('create-group-name-input').fill('共有テスト');
    await page.getByTestId('create-group-button').click();
    
    // メンバー管理モーダルが自動的に開くので閉じる
    await page.waitForSelector('[data-testid="member-management-modal"]');
    await page.keyboard.press('Escape');
    
    // URL共有ボタンをクリック
    await page.getByTestId('share-group-button').click();
    
    // コピー成功メッセージが表示されることを確認
    await expect(page.getByTestId('share-group-button')).toContainText('コピー済み', { timeout: 3000 });
  });

  test('レスポンシブ対応（モバイル）', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // グループ作成
    await page.getByTestId('create-group-name-input').fill('モバイルテスト');
    await page.getByTestId('create-group-button').click();
    
    // メンバー管理モーダルが自動的に開くまで待機
    await page.waitForSelector('[data-testid="member-management-modal"]');
    
    await page.getByTestId('add-member-input').fill('モバイルユーザー');
    await page.getByTestId('add-member-button').click();
    
    await expect(page.locator('[data-testid^="member-item-"]').getByText('モバイルユーザー')).toBeVisible();
  });

  test('複雑な清算シナリオ', async ({ page }) => {
    // グループ作成
    await page.getByTestId('create-group-name-input').fill('複雑な清算');
    await page.getByTestId('create-group-button').click();
    
    // メンバー管理モーダルが自動的に開くまで待機
    await page.waitForSelector('[data-testid="member-management-modal"]');
    
    // 4人のメンバー追加
    const members = ['Alice', 'Bob', 'Charlie', 'David'];
    for (const member of members) {
      await page.getByTestId('add-member-input').fill(member);
      await page.getByTestId('add-member-button').click();
    }
    
    // メンバー管理モーダルを閉じる
    await page.keyboard.press('Escape');
    
    // 複数の支払い追加
    const payments = [
      { amount: '5000', description: 'ホテル代', payer: 'Alice' },
      { amount: '3000', description: '食事代', payer: 'Bob' },
      { amount: '2000', description: '交通費', payer: 'Charlie' },
      { amount: '1000', description: 'お土産代', payer: 'David' }
    ];
    
    for (const payment of payments) {
      await page.getByTestId('add-payment-button').click();
      await page.getByTestId('payment-amount-input').fill(payment.amount);
      await page.getByTestId('payment-description-input').fill(payment.description);
      await page.getByTestId('payment-payer-select').selectOption({ label: payment.payer });
      await page.getByTestId('select-all-participants').click();
      await page.getByTestId('save-payment-button').click();
    }
    
    // 総額と一人当たり金額を確認
    await expect(page.getByTestId('total-amount')).toContainText('11,000');
    await expect(page.getByTestId('per-person-amount')).toContainText('2,750');
    
    // 清算取引が最適化されていることを確認（4人なら最大3取引）
    const settlements = page.locator('[data-testid^="settlement-"]');
    await expect(settlements.count()).resolves.toBeLessThanOrEqual(3);
  });
});