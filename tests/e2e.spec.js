// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('CV Site E2E Tests', () => {
  
  test.beforeEach(async ({ page, baseURL }) => {
    // Use baseURL explicitly to avoid resolution issues
    const targetUrl = baseURL || 'https://adilours.github.io/CV/';
    const response = await page.goto(targetUrl);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load the page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Adil Mhira/);
  });

  test('should have main navigation elements', async ({ page }) => {
    // Check nav exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check nav links
    await expect(page.locator('nav .nav-link')).toHaveCount(4);
    await expect(page.getByText('Accueil')).toBeVisible();
    await expect(page.getByText('Parcours')).toBeVisible();
    await expect(page.getByText('Expertise')).toBeVisible();
    await expect(page.getByText('Contact')).toBeVisible();
  });

  test('should have hero section', async ({ page }) => {
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();
  });

  test('should have parcours section', async ({ page }) => {
    const parcours = page.locator('#parcours');
    await expect(parcours).toBeVisible();
  });

  test('should have expertise section', async ({ page }) => {
    const expertise = page.locator('#expertise');
    await expect(expertise).toBeVisible();
  });

  test('should have contact section', async ({ page }) => {
    const contact = page.locator('#contact');
    await expect(contact).toBeVisible();
  });

  test('should have 3D avatar container', async ({ page }) => {
    const avatarContainer = page.locator('#avatar-3d-container');
    await expect(avatarContainer).toBeVisible();
    
    const canvas = page.locator('#avatar-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should navigate between sections via nav links', async ({ page }) => {
    // Click on Parcours link
    await page.click('a[href="#parcours"]');
    await page.waitForTimeout(500);
    
    // Check that parcours section is in viewport
    const parcours = page.locator('#parcours');
    await expect(parcours).toBeInViewport();
    
    // Check that nav link is active
    const activeLink = page.locator('nav .nav-link.active');
    await expect(activeLink).toHaveAttribute('href', '#parcours');
  });

  test('should toggle Zero Bullshit mode', async ({ page }) => {
    const zbToggle = page.locator('#zb-toggle');
    await expect(zbToggle).toBeVisible();
    
    // Check initial state (not ZB mode)
    const body = page.locator('body');
    await expect(body).not.toHaveClass(/zb-mode/);
    
    // Click to enable ZB mode
    await zbToggle.click();
    await page.waitForTimeout(300);
    
    // Check ZB mode is enabled
    await expect(body).toHaveClass(/zb-mode/);
    
    // Click to disable
    await zbToggle.click();
    await page.waitForTimeout(300);
    
    // Check ZB mode is disabled
    await expect(body).not.toHaveClass(/zb-mode/);
  });

  test('should run audio self-test on diagnostic init', async ({ page }) => {
    await page.click('#zb-toggle');
    await page.waitForTimeout(300);

    const terminal = page.locator('#diagnostic-terminal');
    await terminal.scrollIntoViewIfNeeded();

    await page.fill('#diagnosticFirstName', 'Test');
    await page.fill('#diagnosticEmail', 'test@example.com');
    await page.check('#diagnosticConsent');

    const urlBefore = page.url();
    await page.click('#diagnosticStartBtn');

    await page.waitForFunction(() => typeof window.__audioSelfTestResult === 'boolean');
    const urlAfter = page.url();
    expect(urlAfter).toBe(urlBefore);

    const audioResult = await page.evaluate(() => window.__audioSelfTestResult);
    expect(typeof audioResult).toBe('boolean');
  });

  test('should toggle language FR/EN', async ({ page }) => {
    const langToggle = page.locator('#lang-toggle');
    await expect(langToggle).toBeVisible();
    
    // Check initial language is FR
    const langFr = page.locator('#lang-fr');
    const langEn = page.locator('#lang-en');
    
    // FR should be active initially
    await expect(langFr).toHaveClass(/font-semibold/);
    
    // Click to switch to EN
    await langToggle.click();
    await page.waitForTimeout(300);
    
    // EN should be active now
    await expect(langEn).toHaveClass(/font-semibold/);
    
    // Check content changed to English
    await expect(page.getByText('Home')).toBeVisible();
  });

  test('should load avatarScene object', async ({ page }) => {
    // Wait for avatar to load
    await page.waitForTimeout(3000);
    
    // Check that avatarScene is defined
    const hasAvatarScene = await page.evaluate(() => {
      return typeof window.avatarScene !== 'undefined';
    });
    
    expect(hasAvatarScene).toBe(true);
  });

  test('should have audio player in ZB mode', async ({ page }) => {
    // Enable ZB mode
    await page.click('#zb-toggle');
    await page.waitForTimeout(500);
    
    // Audio player should be visible
    const audioPlayer = page.locator('#audio-player');
    await expect(audioPlayer).toBeVisible();
  });

  test('should have footer with correct year', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('2026');
  });

  test('should have responsive nav on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // Nav should still be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

});
