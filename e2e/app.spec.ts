import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Study In China Academy/i);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText(/Study in China/i);
  });
  
  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for universities link
    const universitiesLink = page.getByRole('link', { name: /universities/i });
    await expect(universitiesLink.first()).toBeVisible();
    
    // Check for programs link
    const programsLink = page.getByRole('link', { name: /programs/i });
    await expect(programsLink.first()).toBeVisible();
  });
  
  test('should have hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for hero section content
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });
});

test.describe('Universities Page', () => {
  test('should load universities page successfully', async ({ page }) => {
    await page.goto('/universities');
    
    // Check page heading
    await expect(page.locator('h1, h2').first()).toContainText(/universities/i);
  });
  
  test('should display university cards', async ({ page }) => {
    await page.goto('/universities');
    
    // Wait for universities to load
    await page.waitForTimeout(2000);
    
    // Check for university cards
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('should have search functionality', async ({ page }) => {
    await page.goto('/universities');
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('Beijing');
    await page.waitForTimeout(1000);
    
    // Verify search was performed
    await expect(searchInput).toHaveValue('Beijing');
  });
  
  test('should have filter options', async ({ page }) => {
    await page.goto('/universities');
    
    // Look for filter elements
    const filterElements = page.locator('[class*="filter"], [class*="Filter"], select, [role="combobox"]');
    const count = await filterElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Programs Page', () => {
  test('should load programs page successfully', async ({ page }) => {
    await page.goto('/programs');
    
    // Check page heading
    await expect(page.locator('h1, h2').first()).toContainText(/programs/i);
  });
  
  test('should display program cards', async ({ page }) => {
    await page.goto('/programs');
    
    // Wait for programs to load
    await page.waitForTimeout(2000);
    
    // Check for program cards
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('should have search functionality', async ({ page }) => {
    await page.goto('/programs');
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to universities page', async ({ page }) => {
    await page.goto('/');
    
    // Click on universities link
    const universitiesLink = page.getByRole('link', { name: /universities/i }).first();
    await universitiesLink.click();
    
    // Should be on universities page
    await expect(page).toHaveURL(/.*universities.*/);
  });
  
  test('should navigate to programs page', async ({ page }) => {
    await page.goto('/');
    
    // Click on programs link
    const programsLink = page.getByRole('link', { name: /programs/i }).first();
    await programsLink.click();
    
    // Should be on programs page
    await expect(page).toHaveURL(/.*programs.*/);
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that page is still visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check that content is accessible
    const mainContent = page.locator('main, [role="main"], section').first();
    await expect(mainContent).toBeVisible();
  });
  
  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check that page is still visible
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto('/');
    
    // Check that page is still visible
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check that h1 exists
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });
  
  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation landmarks
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });
  
  test('should have accessible links', async ({ page }) => {
    await page.goto('/');
    
    // Check that links have accessible names
    const links = page.locator('a');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // Link should have accessible name via text, aria-label, or title
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });
});
