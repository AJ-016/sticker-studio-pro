# ✨ Sticker Studio Pro ✨

> **Your 100% offline, privacy-first, meme-making powerhouse.**

Welcome to **Sticker Studio Pro**! This isn't just a basic cropping tool—it's a full-blown desktop workspace built to create pixel-perfect, high-resolution stickers without ever sending a single byte of your data to the cloud. 

Powered by local AI and built with a sleek, dark-mode professional interface. 🚀

---

## 🌟 The Magic Features

* 🧠 **Offline AI Brain:** Automatically removes backgrounds in seconds using the lightweight `u2netp` neural network. No internet? No APIs? No problem.
* 🎨 **Pro-Level Workspace:** A fully custom, Adobe-style interface with vertical toolbars, floating property flyouts, and a digital status bar.
* ✂️ **Infinite Canvas Control:** Zoom in up to **5000%**, hold `Spacebar` to pan around, and use the smart Eraser tool to manually clean up edges.
* ✍️ **Advanced Typography:** Drop in multiple text elements, drag them around, and style them with fancy local fonts, outlines, and colors.
* ⏱️ **Time Travel (Undo/Redo):** Made a mistake? `Ctrl + Z` and `Ctrl + Y` are fully supported with a 25-step history stack.
* 📸 **Dual Export:** Save instantly as a 512x512 `.webp` (ready for WhatsApp/messaging) or blast it out as a massive 1024x1024 High-Res `.png`.

---

## 🚀 Quick Start Guide

Since this app runs a powerful AI backend and a sleek frontend, we need to set up both sides. **You only have to do this once!**

### Step 1: The Frontend (Node.js)
Open your terminal in the main `sticker-maker` folder and install the UI dependencies:
```bash
npm install
```

### Step 2: The AI Backend (Python)
We need to create a cozy virtual environment for the AI so it doesn't mess with your computer's main Python setup.

1. Move into the API folder:
   ```bash
   cd api
   ```
2. Create the virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate it:
   * **Windows:** `venv\Scripts\activate`
   * **Mac/Linux:** `source venv/bin/activate`
4. Install the magic libraries:
   ```bash
   pip install -r requirements.txt
   ```
5. Head back to the main folder:
   ```bash
   cd ..
   ```

---

## 🎮 How to Run the App

Whenever you want to launch Sticker Studio Pro, just make sure your Python virtual environment is activated, then start the app!

```bash
# 1. Activate the AI backend (if it isn't already)
# Windows:
api\venv\Scripts\activate
# Mac/Linux:
source api/venv/bin/activate

# 2. Launch the studio!
npm start
```

---

## ⌨️ Pro Keyboard Shortcuts

Work faster with these built-in hotkeys:
* **`Spacebar` (Hold):** Temporarily switches to the Pan tool so you can drag the canvas around.
* **`Mouse Wheel`:** Smooth zoom directly to your cursor.
* **`Delete` / `Backspace`:** Instantly deletes the currently selected text.
* **`Escape`:** The panic button! Drops all selections, closes flyout menus, and resets your tool focus.
* **`Ctrl + Z` / `Ctrl + Y`:** Undo and Redo your text and eraser strokes.

---

## 🛠️ Tech Stack
* **Frontend:** Electron, HTML5 Canvas API, Vanilla JS, Custom CSS.
* **Backend:** Python, FastAPI, Uvicorn.
* **AI Model:** `rembg` (u2netp).

---

*Built with local-first passion. Happy Sticker Making! 🎨🐶🔥*
