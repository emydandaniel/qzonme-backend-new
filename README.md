# Quiz Builder Backend

This is the backend application for the Quiz Builder project. It's built with Express.js, TypeScript, and uses PostgreSQL with Drizzle ORM.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=your_database_url
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SENDGRID_API_KEY=your_sendgrid_api_key
```

3. Run the development server:
```bash
npm run dev
```

## Deployment on Render

1. Push this directory to a GitHub repository
2. Go to [Render](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Add the environment variables in the Render dashboard
6. Set the build command to: `npm install && npm run build`
7. Set the start command to: `npm start`
8. Deploy!

## Database Setup

The application uses Drizzle ORM with PostgreSQL. To push database changes:

```bash
npm run db:push
```

## Build

To build the project:
```bash
npm run build
```

The build output will be in the `dist` directory. 