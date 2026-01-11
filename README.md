# Unstuck

**Break through task paralysis with AI-powered 15-minute steps.**

Unstuck is a free, privacy-first web app that helps people overwhelmed by a task break it down into small, actionable steps. Each step is designed to take 15 minutes or less, with the first step being almost trivially easy to start.

[Try Unstuck](unstuck-task.org) | [View the Prompt](prompts/breakdown.md)

---

## Why This Exists

Millions of people search for help with "task paralysis" and "executive dysfunction" every month. Many are neurodivergent individuals (ADHD, autism) or anyone experiencing overwhelm who needs a simple tool, not another complex productivity system.

Existing solutions often:
- Require accounts and subscriptions
- Track user data
- Add complexity instead of reducing it
- Focus on organizing tasks rather than *starting* them

Unstuck is different:
- **No account required** - just open and use
- **No tracking** - everything stays in your browser
- **No complexity** - one input, one output
- **Free forever** - MIT licensed, open source

---

## How It Works

1. **Describe what you're stuck on** - Write a few sentences about the task that feels overwhelming
2. **Get actionable steps** - AI breaks it down into 5-7 concrete steps, each under 15 minutes
3. **Start with step 1** - The first step is intentionally trivial to lower your activation energy
4. **Use the timer** - Optional 15-minute timer to stay focused
5. **Mark progress** - Check off steps as you complete them
6. **Export if needed** - Copy or download your steps as a checklist

### The Methodology

The first step is always almost embarrassingly easy. Things like:
- "Open a new document and type today's date"
- "Walk to where you keep the supplies and put them on your desk"
- "Open the website - don't do anything yet, just open it"

This works because task paralysis isn't about not knowing *what* to do - it's about the activation energy required to *start*. Once you've done one tiny thing, the next feels more possible.

---

## Self-Hosting

Unstuck is a static website with no backend. You can host it anywhere:

### GitHub Pages (Easiest)

1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch" → main
4. Your site will be live at `yourusername.github.io/unstuck`

### Any Static Host

1. Clone or download this repository
2. Upload the files to any static hosting (Netlify, Vercel, Cloudflare Pages, etc.)
3. That's it - no build step required

### Local Development

```bash
# Clone the repository
git clone https://github.com/awohletz/unstuck.git
cd unstuck

# Serve with any static server
npx serve .
# or
python -m http.server 8000
```

---

## Getting an API Key

Unstuck uses Google's Gemini AI. You'll need a free API key:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into Unstuck's settings

**Your API key:**
- Is stored only in your browser's localStorage
- Is sent only to Google's API (never to us)
- Never leaves your device otherwise

The free tier is generous enough for personal use.

---

## Privacy

**We don't track anything.**

- No analytics
- No cookies (except your own browser's localStorage)
- No data collection
- No accounts
- No servers

Everything runs in your browser. Your tasks, your API key, and your progress never leave your device (except for the API call to Google, which you control with your own key).

The code is open source - you can verify this yourself.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Ideas for contributions:
- Accessibility improvements
- Translations
- Bug fixes
- Documentation
- Design refinements

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no build step)
- **AI**: Google Gemini 3.0 Flash Preview
- **Hosting**: Any static file host

Why vanilla JS? Because:
- No build step = forkable and runnable immediately
- Smaller payload = faster load times
- Simpler = easier to contribute to
- Future-proof = no framework churn

---

## License

MIT License - Do whatever you want with it.

See [LICENSE](LICENSE) for the full text.

---

## Acknowledgments

This project is informed by research on:
- Behavioral activation (CBT technique)
- Implementation intentions
- The Zeigarnik effect
- BJ Fogg's Tiny Habits

And built with empathy for everyone who has ever stared at a task and felt frozen.

---

*Made with care for people who sometimes need a little help getting unstuck.*
