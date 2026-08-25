<div align="center">
  <h1>Project K.O.L.A.M.</h1>
  <h3>Kinetic Orbital Lattice &amp; Architectural Matrix</h3>
  <p><strong>Where Mathematics Becomes Art.</strong></p>
  <p>
    A cultural-tech frontend that treats traditional Kolam as a living mathematical system of dots, loops, symmetry, topology, rhythm, and architectural geometry.
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vanilla%20HTML%2FCSS%2FJS-C85A32?style=for-the-badge" alt="Frontend">
  <img src="https://img.shields.io/badge/Backend-FastAPI-6B1D2F?style=for-the-badge" alt="Backend">
  <img src="https://img.shields.io/badge/AI-Kolam%20Generation-D4AF37?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/Theme-Village%20Courtyard-4A121F?style=for-the-badge" alt="Village Theme">
</p>

<hr>

🌾 About the Project

<strong>Project K.O.L.A.M. — Kinetic Orbital Lattice & Architectural Matrix</strong> is a cultural-computing experience built around a simple idea:

<blockquote>
  <strong>What if a traditional Kolam could be understood, generated, restored, and explored like an engineering system?</strong>
</blockquote>

Kolam is not treated as a decorative image. The project models the visual language of Kolam through:

<strong>Pulli</strong> — the dot/grid reference system

<strong>Kambi</strong> — continuous looping curves

<strong>Symmetry</strong> — especially rotational and D4-style symmetry

<strong>Topology</strong> — continuous paths, loops, and non-intersecting structures

<strong>Geometry</strong> — coordinates, matrices, radial forms, and pattern repetition

<strong>Algorithms</strong> — procedural generation from a natural-language description

<strong>Restoration</strong> — reconstructing a damaged or incomplete Kolam

The frontend intentionally presents this engineering idea through the atmosphere of a traditional village courtyard: rice-flour textures, terracotta and maroon pigments, gold accents, handmade linework, village architecture, and a doorway sequence that leads into the interface.

🪔 The Idea Behind the Name

<strong>K.O.L.A.M.</strong>

<em>Kinetic Orbital Lattice & Architectural Matrix</em>

The name describes the project as an engineering abstraction:

Term

Interpretation in K.O.L.A.M.

<strong>Kinetic</strong>

The pattern is dynamic: dots appear, curves trace themselves, interfaces react, and the experience unfolds like a ritual.

<strong>Orbital</strong>

Kolam curves move around reference points and repeatedly orbit the underlying dot system.

<strong>Lattice</strong>

Pulli/dot arrangements form the coordinate framework from which patterns emerge.

<strong>Architectural</strong>

Kolam is historically connected to thresholds, courtyards, entrances, and domestic space.

<strong>Matrix</strong>

The dot grid can be interpreted as a structured mathematical matrix that drives procedural construction.

This is the core philosophy of the project: <strong>turn visual tradition into a computational framework without removing its cultural identity.</strong>

✨ What the Website Does

1. Voice-Guided Kolam Generation

Users can describe a Kolam pattern using speech. The browser's speech-recognition interface converts the spoken idea into a text prompt and sends it into the generation pipeline.

Example:

"Create a 5x5 dot Kolam with lotus symmetry"

The frontend supports natural-language and Hinglish number interpretation such as:

5x5
seven by seven
saat dot
9x9 traditional grid

2. Conversational Text Generation

Users can describe a pattern in plain language instead of manually specifying every mathematical parameter.

Examples:

5x5 dot grid Kolam with lotus symmetry

7x7 continuous Eulerian loop Sikku Kolam

8-fold radial mandala Kolam

The frontend first interprets the prompt, identifies dot-count/grid information, creates a procedural result immediately, and can then use the FastAPI rendering endpoint when the backend is available.

3. Procedural Mathematical Generation

The frontend contains a mathematical generator so the experience does not become unusable while waiting for a remote AI/backend service.

The pipeline concept is:

Natural Language
      ↓
Prompt Normalisation
      ↓
Dot Count + Grid Detection
      ↓
Procedural Kolam Construction
      ↓
Optional FastAPI Rendering
      ↓
Final Kolam Artwork

The source implementation extracts dot-count information and switches between grid forms such as diamond and square/matrix interpretations before rendering the pattern.

4. Kolam Restoration

A user can upload an existing Kolam image and attempt to restore the missing, damaged, eroded, or incomplete geometry.

Supported interaction:

Upload image
    ↓
Client-side image compression
    ↓
Restoration request
    ↓
Reconstructed Kolam
    ↓
Compare / save / download

5. Kolam of the Day

The website includes a featured community pattern designed as a daily cultural-art showcase.

The experience treats the featured Kolam more like an <strong>art object on a village wall</strong> than a conventional social-media card.

6. Community Wall

Users can:

Upload their own Kolam

Add an optional caption

Publish it to the community wall

Like posts

Open comment panels

Add comments

View generated/sample patterns

Keep community state locally in the browser

The frontend renders both stored user posts and predefined sample Kolam content into the community feed.

7. Saved Gallery

Generated and restored patterns can be saved into a local gallery and revisited later from the interface.

The project therefore has a complete loop:

Create → Generate → Explore → Save → Share

🚪 The Village Door Experience

The website does not simply jump from a generic loading screen into a dashboard.

The opening sequence is designed as a metaphorical threshold:

Dawn
  ↓
Pulli dots appear
  ↓
Kambi traces the Kolam
  ↓
Pattern completes
  ↓
Village doorway appears
  ↓
A villager opens the wooden door
  ↓
Courtyard is revealed
  ↓
K.O.L.A.M interface begins

This turns the website into a <strong>digital threshold</strong>: the user enters the project in the same way a visitor would enter a traditional courtyard.

🎨 Visual Design System

The design is based on the original K.O.L.A.M palette:

Role

Color

Ivory

#FAF7F2

Paper

#F5EFE6

Card

#FFFDF9

Terracotta

#C85A32

Terracotta Hover

#B24923

Maroon

#6B1D2F

Dark Maroon

#4A121F

Gold

#D4AF37

Saffron

#E69A28

Text Dark

#3B2319

Text Muted

#70584C

Leaf Green

#2E6F40

Typography

<strong>Cormorant Garamond</strong> — titles, headings, cultural/editorial voice

<strong>Inter</strong> — interface, controls, body text

<strong>Fira Code</strong> — mathematical/system labels

<strong>Tiro Devanagari Hindi</strong> — Hindi splash typography

<strong>Tiro Tamil</strong> — Tamil splash typography

The visual language intentionally sits between:

Traditional village courtyard
            +
Editorial art direction
            +
Mathematical interface
            +
Modern cultural technology

🧭 Main User Journey

┌──────────────────────┐
│   Open K.O.L.A.M.    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Kolam Intro Ritual   │
│ Pulli → Kambi        │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Village Door Opens   │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Courtyard Interface  │
└──────┬───────┬───────┘
       │       │
       │       └───────────────┐
       ↓                       ↓
   Generate                 Restore
   Voice/Text               Upload
       │                       │
       └──────────┬────────────┘
                  ↓
            Kolam Result
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
     Gallery            Community

🧠 Mathematical Model

The project treats a Kolam as a system composed of a set of reference points and a family of curves.

A simplified representation is:

P = {p₁, p₂, ..., pₙ}

where each pᵢ is a Pulli/dot location.

A generated Kolam can then be understood as:

K = (P, C, S, T)

where:

P = Pulli/grid points

C = continuous curve set

S = symmetry constraints

T = topological/path constraints

For grid-based patterns, the interface can transform a natural-language request into a structured representation such as:

{
  "dot_count": 25,
  "grid_type": "square",
  "symmetry_type": "D4_Square"
}

The frontend then converts this representation into an artwork while preserving the underlying mathematical structure.

🏗️ Architecture

flowchart TD
    A[User] --> B[Village Courtyard UI]
    B --> C{Creation Mode}
    C --> D[Voice]
    C --> E[Text]
    C --> F[Restore]

    D --> G[Prompt Normalisation]
    E --> G
    F --> H[Image Compression]

    G --> I[Procedural Kolam Engine]
    G --> J[FastAPI Render Endpoint]
    H --> K[FastAPI Restore Endpoint]

    I --> L[Kolam Result]
    J --> L
    K --> L

    L --> M[Download]
    L --> N[Saved Gallery]
    L --> O[Community]

🧩 Technology Stack

Frontend

HTML5

CSS3

Vanilla JavaScript

SVG

Canvas API

Web Speech API

FileReader API

LocalStorage

Font Awesome

Google Fonts

Backend Integration

FastAPI backend

JSON API communication

Backend health monitoring

Remote rendering endpoint

Image restoration workflow

The current frontend configuration points to:

https://project-k-o-l-a-m-backend.onrender.com

📁 Project Structure

A typical frontend structure is:

kolam-frontend/
│
├── index.html
├── style.css
├── script.js
│
├── data/
│   └── kolam-facts.json
│
└── README.md

File responsibilities

File

Responsibility

index.html

Page structure, navigation, hero, creation workspaces, result area, community wall, gallery, loading/door experience

style.css

Design system, responsive layout, animations, village theme, typography, Kolam visuals

script.js

Application state, generation flow, voice recognition, restoration, community state, gallery, loading experience

data/kolam-facts.json

Cultural/ethnomathematical facts shown by the loading experience

🚀 Getting Started

1. Clone the repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd kolam-frontend

2. Run the frontend locally

Because the project loads assets and JavaScript modules/data from relative paths, use a local HTTP server instead of opening index.html directly with file://.

Option A — VS Code Live Server

Install the <strong>Live Server</strong> extension and open index.html with Live Server.

Option B — Python

python -m http.server 5500

Then open:

http://localhost:5500

3. Backend

The frontend can communicate with the configured FastAPI backend when it is available.

The health check uses:

GET /health

The generation workflow uses the rendering service through the configured backend base URL.

🔌 Generation Flow

The frontend is deliberately designed to remain useful even if the remote backend is unavailable.

User Prompt
     ↓
Normalise words / numbers
     ↓
Extract dot count
     ↓
Determine grid type
     ↓
Render procedural Kolam immediately
     ↓
Backend available?
   ↙       ↘
 YES        NO
  ↓          ↓
FastAPI   Keep local
render    procedural result
  ↓          ↓
  └──────┬───┘
         ↓
     Display Result

This architecture keeps the interaction responsive while allowing the backend to provide a richer rendering result when available.

🎙️ Voice Mode

The voice mode uses the browser's speech-recognition API where supported.

The basic flow is:

Microphone
   ↓
Speech Recognition
   ↓
Transcript
   ↓
Kolam Prompt
   ↓
Generation Pipeline

Example spoken input:

"Make a seven by seven continuous Sikku Kolam with lotus symmetry"

🖼️ Restoration Mode

The restore workflow supports image upload and client-side compression before the image is sent through the restoration pipeline.

The frontend also provides a preview and remove/reset behavior before submission.

🧑‍🤝‍🧑 Community Architecture

Community data is intentionally lightweight and frontend-first.

The browser maintains:

Posts
Likes
Comments

as local application state.

The community flow is:

Upload image
     ↓
Compress image
     ↓
Preview
     ↓
Optional caption
     ↓
Create post object
     ↓
Save community state
     ↓
Re-render feed

This makes the community prototype usable without requiring a separate social backend for the frontend experience.

🌱 Why This Project Matters

K.O.L.A.M. is designed around preservation through translation.

Traditional art can be documented as an image, but documentation alone does not explain the system underneath it.

This project attempts to preserve another layer:

Traditional Knowledge
        ↓
Visual Rules
        ↓
Mathematical Structure
        ↓
Algorithms
        ↓
Interactive Software

The result is not intended to replace the human artist. Instead, it creates a computational environment in which the logic of the art can be explored, generated, restored, and taught.

🛰️ Cultural Geometry → Engineering Thinking

The most important conceptual bridge in K.O.L.A.M. is this:

Kolam concept

Engineering interpretation

Pulli

Coordinate/reference system

Kambi

Continuous path/curve

Symmetry

Constraint

Repetition

Pattern generation

Grid

Lattice/matrix

Loop

Topological path

Threshold

Interface boundary

Courtyard

Shared interaction space

This is why the title <strong>Kinetic Orbital Lattice & Architectural Matrix</strong> is more than a creative expansion of the word “Kolam.” It expresses the computational model the project is trying to build.

🔮 Future Scope

Potential next stages for the project include:

<strong>Graph-based Kolam representation</strong> — represent every Pulli and connection as a formal graph.

<strong>Pattern validation</strong> — automatically verify symmetry, continuity, intersections, and topological constraints.

<strong>More Kolam families</strong> — Sikku, Pulli, Neli, and region-specific styles.

<strong>Multilingual prompting</strong> — deeper Hindi/Tamil support for cultural accessibility.

<strong>Artist mode</strong> — allow a human to place Pulli manually and let the system complete the loop.

<strong>Computer-vision restoration</strong> — infer missing geometry from damaged real-world Kolam photographs.

<strong>Pattern export</strong> — printable designs, construction guides, and SVG/vector output.

<strong>Educational mode</strong> — explain the mathematics of a pattern step-by-step.

<strong>Research datasets</strong> — structure Kolam patterns as machine-readable geometric examples.

🛠️ Development Notes

The project is intentionally built with a lightweight frontend architecture so that the core experience remains understandable without a heavy UI framework.

That makes it suitable for:

hackathon demonstrations

cultural-tech prototypes

ethnomathematics research interfaces

educational tools

generative-art experiments

computer-vision restoration prototypes

🤝 Contributing

Contributions are welcome.

A useful contribution can be anything that improves:

Kolam mathematical modelling

cultural documentation

accessibility

multilingual support

procedural generation

restoration

UI/UX

community functionality

performance

responsive design

Suggested contribution workflow

git checkout -b feature/your-feature

Make your changes, test the frontend, and open a pull request with:

what changed

why it changed

screenshots/video for UI work

test steps

known limitations


👨‍💻 Project Identity

<div align="center">
  <p><strong>PROJECT K.O.L.A.M.</strong></p>
  <p><em>Kinetic Orbital Lattice &amp; Architectural Matrix</em></p>
  <p>Traditional geometry. Computational thinking. Living cultural memory.</p>
  <p><strong>Where Mathematics Becomes Art.</strong></p>
</div>
