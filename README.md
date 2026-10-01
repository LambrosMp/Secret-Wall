Markdown
# Secret Wall 🤫✨

An elegant, pseudonymous social platform designed for university communities. Built with modern web technologies, it features a premium "Matte Obsidian" aesthetic, seamless interactions, nested discussions, and instant direct messaging.

<img width="1703" height="914" alt="image" src="https://github.com/user-attachments/assets/42d65fe0-acd3-4844-b511-5d42323d77a1" />

<img width="1684" height="902" alt="image" src="https://github.com/user-attachments/assets/67212ab0-a8a4-4c1f-8d0b-e4e00b3d7346" />

<img width="1575" height="883" alt="image" src="https://github.com/user-attachments/assets/5fe489ba-11af-4457-9f05-01e7a15aabd9" />




## 🌟 Key Features

* **Pseudonymous Identity System:** Ephemeral sessions using `sessionStorage`. Users pick a username upon entry; data persists on refresh but clears completely when the tab is closed.
* **Premium UI/UX:** A high-end commercial design featuring a "Matte Obsidian" & "Warm Champagne" dark mode (default) and a clean Light mode.
* **Modern 3-Column Layout:** Sticky compose sidebar, infinite scroll main feed, and a collapsible Direct Messages drawer for desktop. Fully responsive for mobile.
* **Instant Direct Messages:** Barrier-free, instant private chats between users.
* **Nested Comments:** Hierarchical reply system with independent comment likes.
* **Interactive Campus Polls:** Native polling system with progress bars and dynamic percentage updates.
* **Share as Story:** Export posts as beautifully formatted PNG cards (9:16 or 1:1) ready for Instagram Stories or other social media.
* **Campus Categories:** Filter content by specific universities (e.g., ΠΑΜΑΚ, ΑΠΘ, ΔΙΠΑΕ) or general events.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS (Custom Matte Obsidian & Warm Champagne theme)
* **Database:** SQLite
* **ORM:** [Prisma](https://www.prisma.io/)
* **Icons:** Lucide React / Heroicons

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
* Node.js 18.x or later
* npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/secret-wall.git](https://github.com/YOUR_USERNAME/secret-wall.git)
   cd secret-wall
Install dependencies

Bash
npm install
Set up the database
Initialize the SQLite database and run the Prisma migrations:

Bash
npx prisma db push
Seed the database (Optional)
If you have a seed script configured in your package.json to populate initial categories:

Bash
npm run seed
Start the development server

Bash
npm run dev
Open http://localhost:3000 with your browser to see the result.

📁 Project Structure
Plaintext
├── prisma/                  # Database schema (schema.prisma) and SQLite file
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/          # Reusable React components (Feed, Sidebar, DMs, Polls)
│   ├── lib/                 # Utility functions, Prisma client, and types
│   └── styles/              # Global CSS and Tailwind directives
├── public/                  # Static assets
└── tailwind.config.ts       # Tailwind CSS configuration and custom color palette
