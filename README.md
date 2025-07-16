A modern web application built with [V0.dev](https://v0.dev), powered by **Next.js**, **Tailwind CSS**, and integrated with **Supabase** for authentication and database management. It also features an automated reporting system via **N8N**, triggered through a secure webhook.

---

## 🚀 Features

- ✨ **No-Code Frontend Design** with [V0.dev]
- ⚡ **Next.js** framework for fast and scalable server-side rendering
- 🎨 **Tailwind CSS** for clean and responsive UI
- 🔐 **Supabase Auth** for secure login & user management
- 🧾 **PostgreSQL Database** powered by Supabase
- 🔄 **Webhook Integration** for automated workflows
- ⚙️ **N8N Automation** to handle reports, send notifications, or store external data

---

## 🛠 Tech Stack

- **Frontend:** [V0.dev](https://v0.dev), Next.js, Tailwind CSS
- **Backend:** Supabase (Auth + DB)
- **Automation:** N8N workflow automation via webhook

---

## 📡 Webhook Integration

A secure `POST` webhook endpoint listens for report submissions from the frontend. When triggered, it sends structured data to an **N8N workflow**, which can be configured to:

- Log reports
- Send Slack/Email alerts
- Store data in other apps
- Trigger additional logic (e.g., ML model, alerts, etc.)
