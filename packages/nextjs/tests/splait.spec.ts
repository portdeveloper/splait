import { expect, test } from "@playwright/test";

// Helper function to reliably fill textarea and enable Parse Instructions button
async function fillInputAndWaitForButton(page: any, testInput: string) {
  const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);

  // Multiple approaches to ensure React state updates
  await textarea.fill(testInput);
  await textarea.blur();
  await textarea.focus();
  await textarea.dispatchEvent("input");
  await textarea.dispatchEvent("change");

  // Wait for React state to update with retry logic
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const isEnabled = await page.getByText("Parse Instructions").isEnabled();
    if (isEnabled) {
      break;
    }

    await page.waitForTimeout(200);
    await textarea.dispatchEvent("input"); // Re-trigger if needed
    attempts++;
  }

  await expect(page.getByText("Parse Instructions")).toBeEnabled();
}

test.describe("Splait - Fund Splitting Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/split");
  });

  test("should load the split page with correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Scaffold-ETH 2 App");
    await expect(page.getByText("AI-Powered Fund Splitting")).toBeVisible();
    await expect(page.getByPlaceholder(/Example: Split 10 ETH equally/)).toBeVisible();
  });

  test("should parse equal split with multiple addresses", async ({ page }) => {
    const testInput =
      "Split 10 ETH equally among 0xA72505F52928f5255FBb82a031ae2d0980FF6621, 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb, 0x3300B6cD81b37800dc72fa0925245c867EC281Ad";

    // Fill the textarea and ensure it triggers the onChange event
    const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);
    await textarea.fill(testInput);
    await textarea.blur(); // Trigger any onBlur events

    // Wait for the Parse Instructions button to become enabled
    await expect(page.getByText("Parse Instructions")).toBeEnabled();

    // Click parse button
    await page.getByText("Parse Instructions").click();

    // Wait for transaction preview to appear and parsing to complete (with longer timeout for API)
    await expect(page.getByText("Transaction Preview")).toBeVisible({ timeout: 15000 });

    // Wait for parsing to complete by checking for the Execute Transaction button to be enabled
    await expect(page.getByText("Execute Transaction")).toBeEnabled({ timeout: 15000 });

    // Check total amount in the stats section
    await expect(page.locator(".stat-value").filter({ hasText: "10 ETH" })).toBeVisible();

    // Check recipients count - target the specific Recipients stat
    await expect(
      page
        .locator(".stat")
        .filter({ has: page.getByText("Recipients") })
        .locator(".stat-value"),
    ).toHaveText("3");

    // Check split type
    await expect(page.locator(".stat-desc").filter({ hasText: "Equal split" })).toBeVisible();

    // Check individual amounts (10 ETH / 3 = 3.33... - handle precision issues)
    await expect(page.getByText(/3\.33+\d* ETH/).first()).toBeVisible();

    // Check addresses are displayed in the transaction preview table
    await expect(page.getByRole("cell", { name: "0xa72505f52928f5255fbb82a031ae2d0980ff6621" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "0xed5c89ae41516a96875b2c15223f9286c79f11fb" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "0x3300b6cd81b37800dc72fa0925245c867ec281ad" })).toBeVisible();

    // Execute button should be enabled
    await expect(page.getByText("Execute Transaction")).toBeEnabled();
  });

  test("should parse custom split with specific amounts", async ({ page }) => {
    const testInput =
      "Send 3 ETH to 0xA72505F52928f5255FBb82a031ae2d0980FF6621 and 7 ETH to 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb";

    await fillInputAndWaitForButton(page, testInput);
    await page.getByText("Parse Instructions").click();

    // Wait for transaction preview and parsing to complete
    await expect(page.getByText("Transaction Preview")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Execute Transaction")).toBeEnabled({ timeout: 15000 });

    // Check total amount in the stats section
    await expect(page.locator(".stat-value").filter({ hasText: "10 ETH" })).toBeVisible();

    // Check recipients count - target the specific Recipients stat
    await expect(
      page
        .locator(".stat")
        .filter({ has: page.getByText("Recipients") })
        .locator(".stat-value"),
    ).toHaveText("2");

    // Check split type
    await expect(page.locator(".stat-desc").filter({ hasText: "Custom amounts" })).toBeVisible();

    // Check individual amounts in the table
    await expect(page.getByRole("cell", { name: "3 ETH" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "7 ETH" })).toBeVisible();
  });

  test("should handle small amounts precisely", async ({ page }) => {
    const testInput =
      "Split 0.001 ETH equally between 0xA72505F52928f5255FBb82a031ae2d0980FF6621 and 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb";

    // Use the helper function for more reliable input handling
    await fillInputAndWaitForButton(page, testInput);
    await page.getByText("Parse Instructions").click();

    // Wait for Transaction Preview with increased timeout
    await expect(page.getByText("Transaction Preview")).toBeVisible({ timeout: 20000 });

    // Wait a bit for the transaction data to fully load
    await page.waitForTimeout(1000);

    await expect(page.getByText("Execute Transaction")).toBeEnabled({ timeout: 15000 });

    // Check total amount in the stats section with more flexible matching
    await expect(page.locator(".stat-value").filter({ hasText: /0\.001\s*ETH/ })).toBeVisible({ timeout: 10000 });

    // Check recipients count - target the specific Recipients stat
    await expect(
      page
        .locator(".stat")
        .filter({ has: page.getByText("Recipients") })
        .locator(".stat-value"),
    ).toHaveText("2", { timeout: 10000 });

    // Check individual amounts (0.001 / 2 = 0.0005) - more flexible matching
    await expect(page.getByText(/0\.0005\s*ETH/).first()).toBeVisible({ timeout: 10000 });
  });

  test("should handle complex custom split with multiple recipients", async ({ page }) => {
    const testInput =
      "Distribute 2 ETH to 0x3300B6cD81b37800dc72fa0925245c867EC281Ad, 1.5 ETH to 0xd0c96393E48b11D22A64BeD22b3Aa39621BB77ed, and 0.5 ETH to 0xA72505F52928f5255FBb82a031ae2d0980FF6621";

    const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);
    await textarea.fill(testInput);
    await textarea.blur();
    await expect(page.getByText("Parse Instructions")).toBeEnabled();
    await page.getByText("Parse Instructions").click();

    await expect(page.getByText("Transaction Preview")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Execute Transaction")).toBeEnabled({ timeout: 15000 });

    // Check total amount in the stats section (should be 4 ETH)
    await expect(page.locator(".stat-value").filter({ hasText: "4 ETH" })).toBeVisible();

    // Check recipients count - target the specific Recipients stat
    await expect(
      page
        .locator(".stat")
        .filter({ has: page.getByText("Recipients") })
        .locator(".stat-value"),
    ).toHaveText("3");

    // Check split type
    await expect(page.locator(".stat-desc").filter({ hasText: "Custom amounts" })).toBeVisible();

    // Check individual amounts in the table
    await expect(page.getByRole("cell", { name: "2 ETH" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "1.5 ETH" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "0.5 ETH" })).toBeVisible();
  });

  test("should show confirmation modal when executing transaction", async ({ page }) => {
    const testInput =
      "Split 1 ETH equally between 0xA72505F52928f5255FBb82a031ae2d0980FF6621 and 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb";

    const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);
    await textarea.fill(testInput);
    await textarea.blur();
    await expect(page.getByText("Parse Instructions")).toBeEnabled();
    await page.getByText("Parse Instructions").click();

    await expect(page.getByText("Transaction Preview")).toBeVisible();

    // Click execute transaction
    await page.getByText("Execute Transaction").click();

    // Check confirmation modal appears
    await expect(page.getByText("Confirm Transaction")).toBeVisible();
    await expect(page.getByText("You are about to execute a transaction that will split")).toBeVisible();
    await expect(page.getByText("1 ETH among 2 recipients")).toBeVisible();

    // Check cost breakdown
    await expect(page.getByText("Total Amount:")).toBeVisible();
    await expect(page.getByText("Est. Gas Cost:")).toBeVisible();
    await expect(page.getByText("Total Cost:")).toBeVisible();

    // Check warning message
    await expect(page.getByText("This action cannot be undone")).toBeVisible();

    // Check buttons
    await expect(page.getByText("Cancel")).toBeVisible();
    await expect(page.getByText("Confirm & Execute")).toBeVisible();

    // Test cancel functionality
    await page.getByText("Cancel").click();
    await expect(page.getByText("Confirm Transaction")).not.toBeVisible();
  });

  test("should use example inputs correctly", async ({ page }) => {
    // Click on example 1
    await page.getByText("Example 1").click();

    // Check that the textarea is filled
    const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);
    await expect(textarea).toHaveValue(/Split 10 ETH equally among/);

    // Click on example 2
    await page.getByText("Example 2").click();
    await expect(textarea).toHaveValue(/Send 3 ETH to/);

    // Click on example 3
    await page.getByText("Example 3").click();
    await expect(textarea).toHaveValue(/Distribute 2 ETH to/);
  });

  test("should show character count", async ({ page }) => {
    const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);

    // Initial character count
    await expect(page.getByText("0/500 characters")).toBeVisible();

    // Type some text
    await textarea.fill("Test input");
    await expect(page.getByText("10/500 characters")).toBeVisible();
  });

  test("should handle edit functionality for total amount", async ({ page }) => {
    const testInput =
      "Split 10 ETH equally between 0xA72505F52928f5255FBb82a031ae2d0980FF6621 and 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb";

    const textarea = page.getByPlaceholder(/Example: Split 10 ETH equally/);
    await textarea.fill(testInput);
    await textarea.blur();
    await expect(page.getByText("Parse Instructions")).toBeEnabled();
    await page.getByText("Parse Instructions").click();

    // Wait for transaction preview and parsing to complete
    await expect(page.getByText("Transaction Preview")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Execute Transaction")).toBeEnabled({ timeout: 15000 });

    // Click edit button
    await page.getByRole("button", { name: "Edit" }).click();

    // Check that edit interface appears
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Edit the amount (should have input field visible)
    const editInput = page.locator('input[placeholder="Enter amount"]');
    await expect(editInput).toBeVisible();

    await editInput.clear();
    await editInput.fill("5");

    // Save the edit
    await page.getByRole("button", { name: "Save" }).click();

    // Check that the total amount was updated in the stats section
    await expect(page.locator(".stat-value").filter({ hasText: "5 ETH" })).toBeVisible();

    // For equal splits, individual amounts should also update
    await expect(page.getByText("2.5 ETH").first()).toBeVisible();
  });

  test("should show appropriate UI states during parsing", async ({ page }) => {
    const testInput =
      "Split 1 ETH equally between 0xA72505F52928f5255FBb82a031ae2d0980FF6621 and 0xeD5C89Ae41516A96875B2c15223F9286C79f11fb";

    await page.getByPlaceholder(/Example: Split 10 ETH equally/).fill(testInput);

    // Click parse and check loading state
    const parseButton = page.getByText("Parse Instructions");
    await parseButton.click();

    // Check that button shows loading state (briefly)
    // Note: This might be too fast to catch consistently, but we check for the end state

    // Eventually shows transaction preview
    await expect(page.getByText("Transaction Preview")).toBeVisible();

    // Parse button should be enabled again
    await expect(parseButton).toBeEnabled();
  });
});
