# Third Year Project – Project Idea

## Project Idea: DinoProject – Interactive Dinosaur Education and Community Platform

### Purpose
To provide interactive, accessible, and engaging digital education on dinosaurs and palaeontology, supporting knowledge dissemination across learners, enthusiasts, and educators through a unified web platform.

### E-Business / System Category
B2C / Educational Web Platform — the platform serves individual end users (learners, students, and enthusiasts) directly through a free-access model with an optional premium subscription tier for additional content.

---

### Business Case Description

Public interest in dinosaurs and palaeontology is broad, yet access to interactive, engaging, and educational digital resources remains fragmented. Existing resources are largely static web pages, text-heavy articles, or expensive museum exhibits, none of which provide a unified digital experience that combines visual learning, self-assessment, and community engagement.

This project proposes a full-stack interactive web platform, DinoProject, that brings together a 3D dinosaur viewer, a comprehensive encyclopedia, a timeline explorer, knowledge quizzes, a community forum, and an AI-powered assistant in a single application. The platform is designed to make dinosaur education accessible, engaging, and interactive for a global audience, from casual learners to palaeontology enthusiasts and students.

A working prototype has already been developed and is available for review at: [DinoProject Prototype](https://github.com/Ironheart4/Dinoproject)

---

### Problem Statement

There is currently no single, freely accessible platform that combines interactive 3D visualisation of dinosaur species, structured encyclopaedic content, self-assessment tools, community discussion, and an AI assistant in a unified web experience. Existing educational resources are scattered, lack interactivity, and do not cater to varying levels of knowledge or provide a social dimension for enthusiasts to engage with one another.

---

### Project Objectives

* Provide interactive 3D models of dinosaur species viewable in the browser
* Deliver a searchable, filterable encyclopedia of dinosaur species with detailed information
* Display discovery locations and geological periods through an interactive timeline map
* Enable users to test and track their dinosaur knowledge through quizzes
* Provide a community forum for discussions among dinosaur enthusiasts
* Integrate an AI assistant capable of answering dinosaur-related queries
* Support user authentication, profiles, and personalised features such as favourites
* Deliver a responsive, accessible experience across desktop and mobile devices

---

### User Types

**General User / Learner**
* Browse the encyclopedia and 3D dinosaur viewer
* Take quizzes and track personal scores
* Participate in the community forum
* Use the AI assistant for information queries
* Save favourite dinosaurs to a personal list

**Administrator**
* Manage dinosaur records, quizzes, and forum content
* Pin or lock forum threads
* Access the admin dashboard for content management
* Create and update quiz questions and categories

---

### Target Audience

**Students and Educators**
* Interactive learning tool for biology, geology, and natural history subjects

**Palaeontology Enthusiasts**
* Community platform for discussion, discovery, and learning

**Museums and Science Communicators**
* Digital complement to physical exhibits and outreach programmes

**General Public**
* Casual learners seeking engaging and accessible dinosaur content

---

### Value Added by the Project

* Unified platform combining education, interaction, and community in one place
* Free, browser-based access with no specialist software required
* Interactive 3D visualisation to support spatial and visual learning
* Self-assessment through quizzes with score tracking
* Community-driven discussion to extend learning beyond static content
* AI-powered assistant providing instant, contextual answers
* Mobile-optimised for access in any setting

---

### What Sets It Apart from Existing Practices

Unlike static educational websites or isolated museum apps, DinoProject combines interactive 3D models, a knowledge quiz system, a live community forum, and an AI assistant in a single, unified web application with persistent user accounts and personalised features. This multi-modal approach addresses different learning styles and engagement levels within one platform.

---

### Core System Functionality

* 3D dinosaur model viewer with rotation, zoom, and animation playback
* Dinosaur encyclopedia with search and filter capabilities
* Interactive timeline map showing discovery locations
* Quiz engine with question sets, scoring, and history
* Community forum with categories, threads, and replies
* AI assistant for dinosaur-related queries
* User authentication, profiles, and favourites
* Premium subscription tier for access to additional 3D models

---

### System Architecture Overview

* **Presentation Layer:** React 18 frontend with TypeScript and Tailwind CSS; separate admin dashboard
* **3D Graphics Layer:** Three.js with React Three Fiber and GLTFLoader for model rendering
* **Application Layer:** Node.js and Express REST API backend with TypeScript
* **Authentication Layer:** Supabase Auth with JWT-based session management
* **Data Layer:** PostgreSQL database accessed via Prisma ORM, hosted on Supabase
* **AI Layer:** Hugging Face API integration for the DinoBot assistant
* **Infrastructure:** Backend deployed on Render; frontend deployed on Vercel

---

### Feasibility Analysis

**Technical Feasibility:** Built using established, well-documented technologies (React, Node.js, Three.js, PostgreSQL) that are suitable for a third-year project

**Operational Feasibility:** Accessible via any modern browser; requires no installation or specialist hardware from the end user

**Economic Feasibility:** Open-source libraries and free-tier cloud services (Supabase, Render, Vercel) keep infrastructure costs minimal

**Time Feasibility:** Core features scoped for completion within the academic year; a working prototype is already complete

---

### Key Constraints

* No original 3D model creation; models sourced from compatible external repositories
* AI assistant limited to text-based query–response interaction
* Forum moderation relies on administrator action rather than automated content filtering
* No offline mode; application requires internet connectivity

---

### Engagement Metrics

The platform provides measurable indicators of educational engagement and usage:

* Number of dinosaur species viewed and time spent per species
* Quiz completion rates and average scores per quiz category
* Forum post and reply counts by category and time period
* AI assistant query volume and response usage
* User favourite counts indicating species popularity
* Premium subscription conversion rate

---

### Platform Components

1. **3D Dinosaur Viewer**
   Interactive GLTF model viewer with orbit controls, animations, and sound playback

2. **Dinosaur Encyclopedia**
   Searchable and filterable catalogue of 100+ species with images, statistics, and descriptions

3. **Timeline Explorer**
   OpenLayers map displaying dinosaur discovery locations by geological period

4. **Quiz Engine**
   Multiple-choice knowledge quizzes with score tracking and quiz history

5. **Community Forum**
   Categorised discussion threads with post creation, replies, pinning, and locking

6. **AI DinoBot Assistant**
   Floating chat interface powered by Hugging Face for dinosaur-related queries

7. **User Account System**
   Registration, login, profile management, favourites, and premium subscriptions

8. **Admin Dashboard**
   Dedicated admin interface for managing dinosaurs, quizzes, users, and forum content

---

### Technologies Used

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS

**3D Graphics:** Three.js, React Three Fiber, GLTFLoader, DRACOLoader

**Maps:** OpenLayers

**Backend:** Node.js, Express, TypeScript

**Database:** PostgreSQL (Supabase), Prisma ORM

**Authentication:** Supabase Auth (JWT)

**AI Integration:** Hugging Face Inference API

**Payments:** PayPal SDK (subscription tier)

**Infrastructure:** Render (backend), Vercel (frontend and admin)

---

### Summary

DinoProject delivers a comprehensive, interactive dinosaur education platform that addresses the absence of a unified digital resource for palaeontology learning and community engagement. By combining 3D visualisation, encyclopaedic content, interactive quizzes, a community forum, and an AI assistant in a single web application, the project provides measurable educational and community value. With a working prototype already developed, the project demonstrates both technical feasibility and real-world applicability within the scope of a third-year academic project.
