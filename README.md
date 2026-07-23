<<<<<<< HEAD
 #FocusGuardian 🛡️

> A high-performance, low-footprint desktop productivity guardian built with Rust and React.

[![Release Build](https://github.com/Xeni113/Focus_Guardian_Desktop/actions/workflows/release.yml/badge.svg)](https://github.com/Xeni113/Focus_Guardian_Desktop/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Overview
FocusGuardian is designed to enforce distraction-free work sessions through desktop process isolation, background telemetry monitoring, and customizable session rules. By leveraging **Tauri v2** and **Rust**, FocusGuardian achieves sub-30MB RAM idle consumption—outperforming traditional Electron-based alternatives by up to 80%.

## 🏗️ Architecture & Tech Stack
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│            (TypeScript, Tailwind CSS)                  │
└───────────────────────────┬────────────────────────────┘
│ IPC Bridge (Tauri v2)
┌───────────────────────────▼────────────────────────────┐
│                  Rust Core Backend                     │
│    (System Tray, Process Manager, System Metrics)      │
└────────────────────────────────────────────────────────┘

* **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
* **Backend Core:** Rust (Tauri v2)
* **Build Pipeline:** Multi-target GitHub Actions Matrix (Windows x64, Windows ARM64, Linux)

## 📥 Cross-Platform Downloads
Downloads are automatically compiled on release and accessible directly via our [Official Landing Page](https://your-lovable-site.lovable.app) or through [GitHub Releases](https://github.com/Xeni113/Focus_Guardian_Desktop/releases).

| Platform | Architecture | Binary Type | Status |
| :--- | :--- | :--- | :--- |
| **Windows 10/11** | x86_64 | `.exe` / `.msi` | ✅ Supported |
| **Windows 10/11** | ARM64 | `.exe` | ✅ Supported |
| **Linux** | x86_64 | `.AppImage` / `.deb` | ✅ Supported |

## 🛠️ Local Development

```bash
# 1. Clone repo
git clone [https://github.com/Xeni113/Focus_Guardian_Desktop.git](https://github.com/Xeni113/Focus_Guardian_Desktop.git)

# 2. Install Node dependencies
npm install

# 3. Run in development mode
npm run tauri dev
=======
# FocusGuardian 🛡️

> A high-performance, low-footprint desktop productivity guardian built with Rust and React.

[![Release Build](https://github.com/Xeni113/Focus_Guardian_Desktop/actions/workflows/release.yml/badge.svg)](https://github.com/Xeni113/Focus_Guardian_Desktop/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Overview
FocusGuardian is designed to enforce distraction-free work sessions through desktop process isolation, background telemetry monitoring, and customizable session rules. By leveraging **Tauri v2** and **Rust**, FocusGuardian achieves sub-30MB RAM idle consumption—outperforming traditional Electron-based alternatives by up to 80%.

## 🏗️ Architecture & Tech Stack
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│            (TypeScript, Tailwind CSS)                  │
└───────────────────────────┬────────────────────────────┘
│ IPC Bridge (Tauri v2)
┌───────────────────────────▼────────────────────────────┐
│                  Rust Core Backend                     │
│    (System Tray, Process Manager, System Metrics)      │
└────────────────────────────────────────────────────────┘

* **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
* **Backend Core:** Rust (Tauri v2)
* **Build Pipeline:** Multi-target GitHub Actions Matrix (Windows x64, Windows ARM64, Linux)

## 📥 Cross-Platform Downloads
Downloads are automatically compiled on release and accessible directly via our [Official Landing Page](https://your-lovable-site.lovable.app) or through [GitHub Releases](https://github.com/Xeni113/Focus_Guardian_Desktop/releases).

| Platform | Architecture | Binary Type | Status |
| :--- | :--- | :--- | :--- |
| **Windows 10/11** | x86_64 | `.exe` / `.msi` | ✅ Supported |
| **Windows 10/11** | ARM64 | `.exe` | ✅ Supported |
| **Linux** | x86_64 | `.AppImage` / `.deb` | ✅ Supported |

## 🛠️ Local Development

```bash
# 1. Clone repo
git clone [https://github.com/Xeni113/Focus_Guardian_Desktop.git](https://github.com/Xeni113/Focus_Guardian_Desktop.git)

# 2. Install Node dependencies
npm install

# 3. Run in development mode
npm run tauri dev

>>>>>>> b1a2753 (docs: update readme and configs)
