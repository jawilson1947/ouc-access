# OUC Access Control System

A full-stack Next.js application for managing user access requests with Google authentication.

## Prerequisites

- Node.js 18.x or later
- MySQL 8.x
- Google OAuth credentials

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd ouc-access
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following content:
```env
MYSQL_HOST=192.168.72.250
MYSQL_USER=ouc-it
MYSQL_PASSWORD=Y&U*i9o0p
MYSQL_DATABASE=oucsda

# Configure these with your Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret # Generate a secure random string
```

4. Set up Google OAuth:
   - Go to the [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-production-domain.com/api/auth/callback/google`
   - Copy the Client ID and Client Secret to your `.env.local` file

5. Generate a secure random string for NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Features

- Google Authentication
- User Access Request Form
- Image Upload (Drag & Drop)
- Search Functionality
- Email Validation
- MySQL Database Integration

## Deployment

To deploy to the Ubuntu development server:

1. SSH into the server:
```bash
ssh jawilson@192.168.72.250
```

2. Navigate to the deployment directory:
```bash
cd /home/jawilson/fullstack-app
```

3. Clone the repository and install dependencies:
```bash
git clone <repository-url> .
npm install
```

4. Build the application:
```bash
npm run build
```

5. Start the production server:
```bash
npm start
```

## Database Schema

The application uses the following MySQL table structure:

```sql
CREATE TABLE ChurchMembers (
  EmpID INT AUTO_INCREMENT PRIMARY KEY,
  lastname varchar(50) NOT NULL,
  firstname varchar(50) NOT NULL,
  phone varchar(50) NOT NULL,
  email varchar(80) NOT NULL,
  PictureUrl varchar(255),
  email_validation_date datetime DEFAULT NULL,
  request_date datetime NOT NULL,
  device_id varchar(50) DEFAULT NULL,
  user_id varchar(50) DEFAULT NULL,
  gmail varchar(80) DEFAULT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```