# ProFit Team - Egitim Platformu PRD

## Problem Statement
Kapali sistem, liderlik temali, network marketing odakli bir egitim portali. Sadece ekip icin kullanilacak ozel bir akademi.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT token-based
- **PDF**: reportlab + qrcode

## User Personas
1. **Super Admin**: Platform yoneticisi - tum yetkilere sahip
2. **Admin**: Yardimci yonetici - distributor ve egitim yonetimi
3. **Distributor**: Ogrenci - sadece atanan egitimlere erisim

## Core Requirements (Static)
- Kapali sistem (acik kayit yok)
- 3 rol: Super Admin, Admin, Distributor
- Egitim hiyerarsisi: Egitim > Modul > Video > Quiz
- Kilitli ilerleme sistemi (%100 video izleme + %80 quiz gecme)
- PDF sertifika (QR kod ile dogrulama)
- Seviye sistemi (5 kademe)
- Turkce arayuz
- Mobil uyumlu responsive tasarim

## What's Been Implemented (Feb 2026)
- [x] JWT authentication with role-based access control
- [x] Super Admin seed (admin@profitteam.tr)
- [x] User management (CRUD - role-based permissions)
- [x] Course management (CRUD)
- [x] Module management (CRUD with ordering)
- [x] Video management (YouTube embed + upload support)
- [x] Quiz system (multiple choice, randomized questions/options)
- [x] Locked progression system
- [x] Progress tracking per video/quiz
- [x] Course assignment system
- [x] Admin Dashboard with metrics
- [x] Distributor Dashboard with course cards
- [x] Profile page with level/badges
- [x] Reports page (user-based detailed reports)
- [x] PDF certificate generation with Turkish character support (DejaVu Sans font)
- [x] Certificate: QR code removed, Upper Leader congratulation message added
- [x] Level system (5 levels based on completed courses)
- [x] Badge system
- [x] Split-screen login page with motivation text
- [x] Professional sidebar navigation
- [x] Dynamic login page (admin-configurable logo, bg, text)
- [x] Football league-style leaderboard
- [x] Qualifications/Announcements blog section
- [x] Mobile responsive UI
- [x] 28+ API endpoints - 100% functional

## Prioritized Backlog
### P0 (Critical) - DONE
- All core features implemented

### P1 (High)
- Video upload via file upload button in UI
- Email notification system (deferred per user request)
- Bulk user import (CSV)

### P2 (Medium)
- Course reordering drag-and-drop
- Quiz timer
- Discussion/comments per video
- Admin logo upload

### P3 (Low)
- Dark mode toggle
- Course categories/tags
- Export reports to Excel/PDF
- Search functionality across courses

## Next Tasks
1. Video upload UI button integration
2. Admin logo upload feature
3. Bulk course assignment
4. Advanced reporting with charts (Recharts)
