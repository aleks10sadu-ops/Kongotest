@echo off
cd /d "C:\Users\potyl\Projects\Kongotest"
git add -A
git commit -m "feat: Performance optimizations and bug fixes - Fix merge conflicts in FoodDetailModal.js and page.js - Fix useAdminCheck import path - Add security headers (CSP, HSTS, XFO, COOP) - Optimize images for mobile (WebP, smaller sizes) - Add lazy loading and priority loading - Update preconnect hints"
git push origin main
echo Done!
pause

