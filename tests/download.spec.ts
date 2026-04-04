import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Download PDF', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  
  // Login
  await page.fill('input[type="text"]', 'tomer');
  await page.fill('input[type="password"]', '1234');
  await page.click('button:has-text("התחברות")');

  try {
    await page.waitForTimeout(1000);
    // If we are at dashboard and see "ספר חדש"
    const isDashboard = await page.isVisible('text="ספר חדש"');
    if (isDashboard) {
        // click the first book
        await page.click('.book-card');
        await page.waitForTimeout(1000);
    }
  } catch(e) {}
  
  // Setup download listener
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(e => {
    console.log("No download triggered in 30 seconds");
    return null;
  });

  // Click export
  await page.click('button:has-text("ייצוא PDF")');
  console.log("Clicked export, waiting for download...");

  const download = await downloadPromise;
  if (!download) {
    throw new Error("Download failed to start");
  }

  const suggestedFilename = download.suggestedFilename();
  console.log("SUGGESTED FILENAME:", suggestedFilename);

  const path = await download.path();
  console.log("DOWNLOAD PATH:", path);
  
  const stat = fs.statSync(path);
  console.log("FILE SIZE:", stat.size);
});
