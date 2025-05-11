# renubu

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

# Customer Renewal Pages – Prototyping Guide

This project uses a **shared, customizable layout** for customer renewal pages. All customer-specific details are provided via static data objects, making it easy to add or update customers during prototyping.

## How to Add a New Customer Page

1. **Create a Data Object**
   - Open `src/data/customers.ts`.
   - Copy an existing customer data object (e.g., `riskyCorpData` or `acmeCorpData`).
   - Update the fields (name, stats, insights, etc.) for your new customer.
   - Example:
     ```ts
     export const newCustomerData = {
       customer: { name: "NewCo", arr: "$123,000", stages: [ ... ] },
       stats: [ ... ],
       aiInsights: [ ... ],
       miniCharts: [ ... ],
       contextByStep: [ ... ],
       additionalSteps: [ ... ],
       riskLevel: "Medium",
       riskColor: "yellow",
       chatConfig: { ... }
     };
     ```

2. **Create a New Page**
   - In `src/app/customers/`, create a new folder named after your customer (e.g., `new-co`).
   - Inside that folder, create a `page.tsx` file.
   - Import your data object and the shared layout:
     ```tsx
     import { newCustomerData } from "../../../data/customers";
     import CustomerRenewalLayout from "../../../components/customers/CustomerRenewalLayout";

     export default function NewCoPage() {
       return <CustomerRenewalLayout {...newCustomerData} />;
     }
     ```

3. **Customize as Needed**
   - You can further customize the chat dialog, workflow steps, or any section by editing the data object or passing additional props.

## Customization Tips
- **Chat Dialog:**
  - The chat dialog is fully reusable and accepts custom workflow steps, messages, and recommended actions via the `chatConfig` prop.
- **Metrics, Insights, and Charts:**
  - All sections are driven by the data object. Just update the arrays to reflect your customer's data.
- **Risk Indicators:**
  - Set `riskLevel` and `riskColor` for visual emphasis.

## Example Directory Structure
```
src/
  app/
    customers/
      new-co/
        page.tsx
  components/
    customers/
      CustomerRenewalLayout.tsx
      CustomerChatDialog.tsx
  data/
    customers.ts
```

## FAQ
- **Can I fetch data from an API?**
  - Yes! For prototyping, use static data. For production, you can fetch data and pass it to the shared layout.
- **How do I add custom steps or sections?**
  - Add them to your data object and update the shared layout or chat config as needed.

---

**Happy prototyping!**
