export default function ShippingInfoPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Shipping Info</h1>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          Standard delivery usually takes 3 to 5 business days depending on your location,
          product availability, and courier partner service area.
        </p>
        <p>
          Orders above the configured free-shipping threshold may qualify for free delivery.
          Smaller orders can include a delivery fee at checkout.
        </p>
        <p>
          Once your order is confirmed and shipped, tracking updates appear in your order history
          and may also be shared through email notifications.
        </p>
        <p>
          Delivery timelines can be affected during high-demand periods, weather disruptions,
          public holidays, or remote-area logistics constraints.
        </p>
      </div>
    </div>
  );
}
