BuildCore Infrastructure & Materials Corporate Platform
======================================================

Features:
- Dedicated multi-page corporate website (Home, Materials 3D, 3D House Simulator, AI Quality Scan, Commercial Enquiry)
- High-performance WebGL background theme and integrated 120-frame real-time house construction sequence
- Parametric 3D House Building Simulator (Three.js) with 4-step wizard:
  1. Storey height & room customization (Hall, Bedrooms, Kitchen, Dining, Bathrooms, Pooja room)
  2. Brick-by-brick construction sequence (Excavation, Plinth, RCC Columns, Masonry, Windows/Doors, Partitions, Roof, Plastering, Painting)
  3. Interactive interior furnishing (furniture catalogue, wall palettes, floor types)
  4. Brand-standard material estimation (Dalmia DSP Cement, Tata Tiscon Fe 550D TMT, Wire-cut bricks, Kajaria tiles) with direct quote dispatch
- Interactive 3D Materials Showcase (360° orbit, engineering specifications, IS standard compliance)
- AI-Powered Material Quality Camera Scanner (Gemini Vision / Groq Vision / Civil Diagnostics fallback with grading reports & defect detection)
- Node.js Express backend with MongoDB Atlas / Mongoose persistent storage & local resilience fallback

Getting Started:
1. npm install
2. Configure .env (optional: MONGODB_URI, GEMINI_API_KEY, GROQ_API_KEY)
3. npm start
4. Open http://localhost:3000/index.html
