# Constitution AI Agent - Frontend

<img width="3454" height="1873" alt="image" src="https://github.com/user-attachments/assets/95ab9cb8-8703-4370-b8b4-03ec17f60f2a" />


## 🚀 Overview

The Constitution AI Agent Frontend is a modern, responsive web application built with Next.js that provides an intuitive interface for constitutional document analysis. It features AI-powered legal research capabilities with real-time document processing, semantic search, and intelligent question answering.

**🌐 Live Demo:** [https://constitution-ai-agent.vercel.app](https://constitution-ai-agent.vercel.app)

## ✨ Key Features

### 📄 Document Processing
- **PDF Upload & Extraction**: Drag-and-drop PDF upload with text extraction
- **Real-time Progress**: Live processing updates with progress bars
- **Large File Support**: Handles constitution documents up to 50MB
- **Auto-processing**: Automatic AI chunking after upload

### 🔍 AI-Powered Search
- **Natural Language Queries**: Ask questions in plain English
- **Semantic Search Results**: AI-enhanced relevance matching
- **Source Attribution**: Direct links to constitutional sections
- **Context-Aware Responses**: Detailed legal analysis with citations

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 14 | React meta-framework with App Router |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Animations** | Framer Motion | Smooth animations and transitions |
| **PDF Processing** | react-pdftotext | Client-side PDF text extraction |
| **HTTP Client** | Fetch API | API communication |
| **Deployment** | Vercel | Serverless deployment platform |

## 📋 Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm package manager
- Modern web browser

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SavaliyaJay/Constitution-Ai-Agent-frontend.git
cd Constitution-Ai-Agent-frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=https://constitution-ai-agent-backend.onrender.com

# For local development
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 4. Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

## 🏗️ Project Structure

```
constitution-ai-frontend/
├── app/                    # Next.js 14 App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   └── ConstitutionAssistant.tsx  # Main component
├── public/               # Static assets
├── types/               # TypeScript definitions
├── utils/              # Utility functions
├── .env.local         # Environment variables
├── next.config.js    # Next.js configuration
├── tailwind.config.js # Tailwind configuration
└── package.json      # Dependencies
```

## 🎯 Core Components

### ConstitutionAssistant
The main component that handles:
- PDF file upload and processing
- Text extraction and chunking
- Query interface and results display
- Progress tracking and error handling

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production
```env
NEXT_PUBLIC_API_BASE_URL=https://constitution-ai-agent-backend.onrender.com
```

## 🎭 User Experience Features

### Interactive Elements
- **Drag & Drop Upload**: Intuitive file upload
- **Real-time Feedback**: Progress indicators and status updates
- **Keyboard Shortcuts**: Enter to submit queries
- **Loading States**: Animated loading indicators
- **Error Recovery**: User-friendly error messages

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios

## 📊 Performance Optimizations

### Next.js Optimizations
- **Automatic Code Splitting**: Bundle optimization
- **Image Optimization**: Next.js Image component
- **Static Generation**: Pre-built pages where possible
- **API Route Caching**: Efficient data fetching

### Client-Side Optimizations
- **Lazy Loading**: Components loaded on demand
- **Debounced Inputs**: Reduced API calls
- **Memory Management**: Proper cleanup of event listeners
- **Bundle Analysis**: webpack-bundle-analyzer integration

## 🔧 Development Tools

### Code Quality
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## 📈 Analytics & Monitoring

### Performance Monitoring
- Core Web Vitals tracking
- User interaction analytics
- Error boundary implementation
- Performance profiling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write responsive, accessible code
- Add proper error handling
- Test on multiple browsers

## 🐛 Troubleshooting

### Common Issues
1. **PDF Upload Fails**: Check file size (max 50MB) and format
2. **API Connection Error**: Verify backend URL in environment variables
3. **Slow Processing**: Large documents may take time to process
4. **Mobile Display Issues**: Clear browser cache and reload

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare Workers AI** for AI processing capabilities
- **Vercel** for deployment and hosting
- **Tailwind CSS** for the design system
- **Framer Motion** for animations

---

**Experience the Future of Legal Research** 🚀

Visit the live demo: [https://constitution-ai-agent.vercel.app](https://constitution-ai-agent.vercel.app)
