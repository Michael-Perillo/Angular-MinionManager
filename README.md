# Angular Minion Manager

An idle/management game built with Angular 20. Recruit, assign, and upgrade minions to gather resources and expand your empire.

## Tech Stack

- **Angular 20** — application framework
- **TailwindCSS 4** — utility-first styling
- **Storybook 10** — component development and documentation

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- npm (comes with Node.js)

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm start
```

The app runs at [http://localhost:4200](http://localhost:4200).

## Storybook

```bash
npm run storybook
```

Opens at [http://localhost:6006](http://localhost:6006). Configured with a dark theme and [Compodoc](https://compodoc.app/) integration for auto-generated Angular documentation.

To build a static Storybook site:

```bash
npm run build-storybook
```

## Build

```bash
npm run build
```

## Testing

```bash
npm test
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/       # Game data models and interfaces
│   │   └── services/     # Singleton services (game state, resources)
│   ├── shared/
│   │   └── components/   # Reusable UI components
│   └── features/
│       └── game/         # Game feature modules and views
└── styles.css
```
