# Deep Tec Price List Web Application

A comprehensive MERN stack web application for managing product price lists with role-based access control, Excel import/export functionality, and real-time search capabilities.

## Features

### User Roles
- **Admin**: Full access - can add, edit, delete all items, manage categories/brands, manage users, and handle pricing
- **Project Users**: Limited access - can add/edit items (except prices), bulk upload data, but cannot delete or manage categories/brands
- **Employees**: View-only access - can only view data

### Core Functionalities
- ✅ **CRUD Operations**: Create, Read, Update, Delete products
- ✅ **Bulk Operations**: Excel upload/download with validation
- ✅ **Real-time Search**: Search by model number, category, or brand
- ✅ **Advanced Filtering**: Filter by category, brand, HP, phase, price range
- ✅ **Role-based Access Control**: Secure user management
- ✅ **Responsive Design**: Modern Material-UI interface
- ✅ **Data Export**: Download filtered data as Excel

### Product Fields
- Category (Submersible borehole, Submersible, Centrifugal, etc.)
- Brand (Pentax, Samking, Difule, Deep Tec, Coverco, Franklin)
- Model Number
- HP (Horsepower)
- Outlet
- Max Head
- Watt
- Phase (1 Phase / 3 Phase)
- Price (Admin only)

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **multer** + **xlsx** for Excel file handling
- **express-validator** for input validation
- **helmet** + **cors** for security

### Frontend
- **React 18** with hooks
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **xlsx** for Excel operations

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dt_pricelist
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=7d
   
   # Admin credentials (change these!)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## Default Users

After running the seed script, the following users will be available:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | Full access to everything |
| Project User | `project_user` | `project123` | Add/edit items (no pricing/deletion) |
| Employee | `employee` | `employee123` | View-only access |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Brands
- `GET /api/brands` - Get all brands
- `POST /api/brands` - Create brand (Admin only)
- `PUT /api/brands/:id` - Update brand (Admin only)
- `DELETE /api/brands/:id` - Delete brand (Admin only)

### Products
- `GET /api/products` - Get products with filtering/search
- `GET /api/products/category/:id` - Get products by category
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (Admin only)
- `POST /api/products/bulk-upload` - Bulk upload via Excel
- `GET /api/products/download-template` - Download Excel template
- `GET /api/products/export` - Export filtered products

## Excel Upload Format

The Excel file must have the following headers (case-insensitive):
- category
- brand
- model number
- HP
- outlet
- max head
- watt
- phase
- price

**Note**: Project users can upload Excel files, but the price column will be ignored.

## Usage Guide

### For Admins
1. Login with admin credentials
2. Add/manage categories and brands from the home page
3. Navigate to category pages to manage products
4. Use bulk upload/download features for efficient data management
5. Manage user accounts and permissions

### For Project Users
1. Login with project user credentials
2. Add and edit product details (except pricing)
3. Use bulk upload for data entry (pricing will be set to 0)
4. Export data for reporting

### For Employees
1. Login with employee credentials
2. Browse categories and view product information
3. Use search and filtering to find specific products
4. Export data for analysis (prices shown as "N/A")

## Development Notes

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers

### Performance Optimizations
- Database indexing for search
- Pagination for large datasets
- Efficient filtering queries
- File upload size limits
- Error handling and logging

### Future Enhancements
- [ ] Advanced reporting dashboard
- [ ] Product image uploads
- [ ] Price history tracking
- [ ] Email notifications
- [ ] Audit logs
- [ ] Mobile app
- [ ] Multi-language support

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in .env file
   - Verify database permissions

2. **CORS Issues**
   - Check if backend is running on port 5000
   - Verify proxy setting in frontend package.json

3. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in .env
   - Verify user credentials

4. **File Upload Issues**
   - Check file format (only .xlsx and .xls allowed)
   - Verify file size (max 5MB)
   - Ensure correct Excel headers

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the project repository.