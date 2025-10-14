# Deep Tec Price List - User Credentials

## 🔐 Login Credentials

### 👑 Administrator
- **Username**: `admin`
- **Password**: `admin123`
- **Permissions**: 
  - Full access to all features
  - Manage categories, brands, and products
  - Access admin panel
  - Delete categories and brands
  - Manage users
  - Set product prices

### 👤 Project User
- **Username**: `project`
- **Password**: `project123`
- **Permissions**:
  - Add and edit products
  - View all categories and brands
  - Cannot delete categories/brands
  - Cannot access admin panel
  - Cannot set product prices (defaults to 0)

### 👥 Employee
- **Username**: `employee`
- **Password**: `employee123`
- **Permissions**:
  - View-only access
  - Can browse categories and products
  - Cannot add, edit, or delete anything
  - Export functionality available

## 🌐 Application Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 🎯 Quick Testing Guide

1. **Admin Features**:
   - Login as `admin` / `admin123`
   - Click profile menu → "Admin Panel"
   - Test category/brand management
   - Test product deletion from category pages

2. **Project User Features**:
   - Login as `project` / `project123`
   - Go to any category page
   - Click "+" button to add products
   - Test product editing capabilities

3. **Employee Features**:
   - Login as `employee` / `employee123`
   - Browse categories and products
   - Test export functionality
   - Verify no edit/add buttons are visible