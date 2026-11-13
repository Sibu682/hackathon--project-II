# Stock-taking agent (Gemini)

1. `pip install -r requirements.txt`
2. Get a free key at https://aistudio.google.com/apikey and set it:
   - Mac/Linux: `export GEMINI_API_KEY="your-key"`
   - Windows PowerShell: `$env:GEMINI_API_KEY="your-key"`
3. `python stock_agent.py --dry-run`   (no API call, checks the data loads)
4. `python stock_agent.py`             (the real run -> stock_report.md + findings.json)
5. `python stock_agent.py --score`     (grades findings.json against data/answer_key.csv)

If you see "model not found": `python stock_agent.py --model gemini-3-flash-preview`

Never commit or share your API key. The `data/` folder is made-up shop data.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
