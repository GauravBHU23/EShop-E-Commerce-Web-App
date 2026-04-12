"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentApi } from "@/lib/api";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentStatusShell message="Loading payment status..." />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentRequestId = searchParams.get("payment_request_id");
  const paymentId = searchParams.get("payment_id");
  const paymentStatus = searchParams.get("payment_status");

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment...");
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!paymentRequestId || !paymentId) {
        setStatus("failed");
        setMessage("Payment details are missing from the redirect URL.");
        return;
      }

      try {
        const response = await paymentApi.verifyInstamojo(paymentRequestId, paymentId);
        const data = response.data.data;
        setOrderId(data.orderId);

        if (data.verified && data.paymentStatus === "SUCCESS") {
          setStatus("success");
          setMessage("Payment verified successfully. Redirecting to your order...");
          setTimeout(() => {
            router.replace(`/orders/${data.orderId}`);
          }, 1500);
          return;
        }

        setStatus("failed");
        setMessage(paymentStatus === "Credit"
          ? "Payment verification failed. Please contact support."
          : "Payment was not completed successfully.");
      } catch (err: any) {
        setStatus("failed");
        setMessage(err.response?.data?.message || "Unable to verify your payment.");
      }
    };

    verify();
  }, [paymentId, paymentRequestId, paymentStatus, router]);

  return (
    <PaymentStatusShell
      title={status === "loading" ? "Processing Payment" : status === "success" ? "Payment Successful" : "Payment Failed"}
      message={message}
    >
      {status === "failed" && (
        <div className="mt-6 flex flex-col gap-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 font-medium text-primary-foreground"
            >
              View Order
            </Link>
          )}
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center justify-center rounded-lg border px-4 font-medium"
          >
            Back to Checkout
          </Link>
        </div>
      )}
    </PaymentStatusShell>
  );
}

function PaymentStatusShell({
  title = "Processing Payment",
  message,
  children,
}: {
  title?: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {children}
      </div>
    </div>
  );
}
