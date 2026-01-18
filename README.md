# Minesweeper Pro

(Note that all content in this repository and website is released under the MIT license. Please carefully read the [LICENSE](LICENSE) file and properly credit the content before reusing, copying, or adapting it.)

A high-performance, fully functional clone of the popular web-based Minesweeper game. This project aims to replicate the experience of [minesweeper-pro.com](https://minesweeper-pro.com/) using only static web technologies. The website is deployed at [https://zhmgczh.github.io/MinesweeperPro/](https://zhmgczh.github.io/MinesweeperPro/).

## 🚀 Overview

This is a pure client-side implementation of the classic Minesweeper. It requires no backend, no database, and no build tools. It is designed to be lightweight, responsive, and easy to deploy on any static hosting service (GitHub Pages, Vercel, Netlify).

## ✨ Key Features

* **Classic Game Modes:**
    * **Beginner:** $9\times 9$ grid, $10$ mines.
    * **Intermediate:** $16\times 16$ grid, $40$ mines.
    * **Expert:** $30\times 16$ grid, $99$ mines.
    * **Superhuman:** $50\times 50$ grid, $500$ mines.
    * **Extraterrestrial:** $100\times 100$ grid, $2000$ mines.
    * **Custom:** Adjustable width, height, and mine density.
* **Core Mechanics:**
    * Left-click to reveal cells.
    * Right-click to flag/unflag potential mines.
    * **Chording Support:** Double-click (or middle-click) on a number to reveal surrounding cells if the flag count matches the number.
    * First-click safety (the first click is never a mine).
* **UI/UX:**
    * Real-time timer and mine counter.
    * Responsive design for desktop and mobile browsers.
    * "Best Time" statistics saved via `localStorage`.
* **Static Architecture:** Built entirely with Vanilla JS, CSS3, and HTML5.

## 🛠️ Tech Stack

* **HTML5:** Semantic structure for the game board and controls.
* **CSS3:** Flexbox/Grid for layout, custom properties for themes, and transitions for animations.
* **JavaScript (ES6+):** Pure Vanilla JS for game logic, recursive flood-fill algorithms, and state management.