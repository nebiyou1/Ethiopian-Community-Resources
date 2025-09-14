# Ethiopia Community Resources

A comprehensive web application for exploring and discovering summer programs and community resources in Ethiopia.

## 🌟 Features

- **Interactive Program Explorer**: Browse through various summer programs and community initiatives
- **Modern UI/UX**: Clean, responsive design with intuitive navigation
- **Resource Discovery**: Find educational, cultural, and community programs
- **Search & Filter**: Easy-to-use search and filtering capabilities
- **Mobile Responsive**: Optimized for all device sizes
- **Google Authentication**: Secure user authentication with Google OAuth
- **Supabase Integration**: Modern database with real-time capabilities
- **Netlify Deployment**: Serverless deployment with edge functions

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- No additional dependencies required (pure HTML/CSS/JavaScript)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nebiyou1/Ethiopian-Community-Resources.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Ethiopian-Community-Resources
   ```

3. Open `index.html` in your web browser or serve it using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

## 📁 Project Structure

```
Ethiopia-Community-Resources/
├── public/                    # Frontend files
│   ├── index.html            # Main application page
│   ├── dashboard.html        # User dashboard
│   ├── admin.html            # Admin panel
│   ├── app.js                # Frontend JavaScript
│   └── styles.css            # Application styles
├── services/                  # Backend services
│   ├── databaseService.js    # Database operations
│   ├── authService.js        # Authentication logic
│   └── supabaseMigration.js  # Database migration
├── config/                    # Configuration files
│   └── supabase.js           # Supabase client config
├── database/                  # Database schema
│   └── schema.sql            # PostgreSQL schema
├── netlify/                   # Netlify deployment
│   └── functions/            # Serverless functions
├── scripts/                   # Setup and utility scripts
├── docs/                      # Documentation and data
│   └── inputdata.json        # Program data
├── server.js                  # Express server
├── package.json               # Dependencies and scripts
├── netlify.toml              # Netlify configuration
└── DEPLOYMENT.md             # Deployment guide
```

## 🎨 Design Features

- **Modern Color Scheme**: Professional blue and green color palette
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: CSS transitions and hover effects
- **Accessibility**: Semantic HTML and keyboard navigation support

## 🌍 Community Focus

This project aims to:
- Connect Ethiopian communities with valuable resources
- Promote educational and cultural programs
- Facilitate community engagement and participation
- Support local initiatives and organizations

## 🔧 Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth 2.0 with Passport.js
- **Deployment**: Netlify (Serverless Functions)
- **Data**: 176+ summer programs and community resources

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/nebiyou1/Ethiopia-Community-Resources.git
cd Ethiopia-Community-Resources

# Install dependencies
npm install

# Set up environment
npm run setup:env
# Edit .env with your credentials

# Run automated setup
npm run setup

# Start development server
npm run dev
```

## 🤝 Contributing

We welcome contributions! Please feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

For questions or suggestions, please contact:
- **Email**: [Your Email]
- **GitHub**: [@nebiyou1](https://github.com/nebiyou1)

## 🙏 Acknowledgments

- Ethiopian community organizations and leaders
- Local educational institutions
- Community volunteers and contributors

---

**Made with ❤️ for the Ethiopian Community**
