# AWS Certification Tutor
## Demo: https://youtube.com/shorts/fTZElLO8Ppk?feature=share
A cross-platform mobile and web application built with React Native and Expo that helps users prepare for AWS certification exams. Upload AWS certification PDFs, break them down into topics and subtopics using Google Gemini AI, and learn through organized content, videos, and interactive quizzes.

## Features

- **Authentication**: Secure login and registration using Firebase Authentication
- **PDF Upload**: Upload AWS certification PDFs for processing
- **AI-Powered Content Extraction**: Uses Google Gemini API to extract topics, subtopics, and learning resources
- **Organized Learning**: Browse through structured topics and subtopics
- **Resource Links**: Access curated AWS documentation and YouTube tutorials
- **Practice Quizzes**: Test your knowledge with auto-generated quizzes
- **Note-Taking**: Create and manage notes for each topic and subtopic
- **Progress Tracking**: Monitor your learning progress
- **Responsive Design**: Works on both mobile devices and web browsers

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Firebase account (for authentication)
- Google Gemini API key (for PDF processing)

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/aws-certification-tutor.git
cd aws-certification-tutor
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
GEMINI_API_KEY=your_gemini_api_key
```

4. Update the Firebase configuration in `src/context/AuthContext.js` with your Firebase credentials.

## Running the App

### For Development

```
npm start
```

This will start the Expo development server. You can then:
- Press 'a' to run on Android emulator
- Press 'i' to run on iOS simulator
- Press 'w' to run in a web browser
- Scan the QR code with the Expo Go app on your mobile device

### Building for Production

#### For Web
```
npx expo build:web
```

#### For Android
```
npx expo build:android
```

#### For iOS
```
npx expo build:ios
```

## Project Structure

```
aws-certification-tutor/
├── src/
│   ├── assets/           # Images, fonts, and other static assets
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # App screens
│   │   ├── auth/         # Authentication screens
│   │   └── main/         # Main app screens
│   ├── services/         # API and service integrations
│   └── utils/            # Utility functions and constants
├── App.js                # Main app component
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
└── README.md             # Project documentation
```

## Backend Integration

The app uses:
- Firebase for authentication and user management
- Google Gemini API for PDF processing and content extraction
- Local storage (AsyncStorage) for storing user data on the device

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- AWS for their comprehensive certification documentation
- Google for the Gemini AI API
- Expo and React Native for the development framework
