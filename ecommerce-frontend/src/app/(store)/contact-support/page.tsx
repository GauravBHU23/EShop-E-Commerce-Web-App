export default function ContactSupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Contact Support</h1>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          If you need help with orders, payments, refunds, account issues, or product queries,
          our support team is here to assist you.
        </p>
        <p>
          Email support: <span className="font-medium text-foreground">support@eshop.com</span>
        </p>
        <p>
          Response hours: Monday to Saturday, 9:00 AM to 7:00 PM
        </p>
        <p>
          For faster help, include your registered email address, order number, and a short description
          of the issue when contacting support.
        </p>
      </div>
    </div>
  );
}
