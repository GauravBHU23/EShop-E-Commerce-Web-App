export default function ReturnsPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Returns Policy</h1>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          Most products can be returned within 7 days of delivery if they are damaged,
          defective, or different from what was ordered.
        </p>
        <p>
          Products must be returned with original packaging, accessories, invoice,
          and any complimentary items received with the order.
        </p>
        <p>
          Refunds are processed after the returned product passes quality inspection.
          The refunded amount is sent back to the original payment method or store-approved alternative.
        </p>
        <p>
          Some categories such as personal care, customized items, and used products
          may not be eligible for return unless they arrive damaged or incorrect.
        </p>
      </div>
    </div>
  );
}
