import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Leaf, ShieldCheck, Sparkles, Check, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayPoc() {
  const [amount, setAmount] = useState(499);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // {payment_id, order_id, amount}

  const handlePay = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) {
      toast.error("Enter a valid amount (min ₹1)");
      return;
    }
    setLoading(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error("Could not load Razorpay. Check your network.");
        setLoading(false);
        return;
      }

      const { data: order } = await axios.post(`${API}/payments/create-order`, {
        amount_inr: amt,
        receipt: `karijeeva_${Date.now()}`,
        notes: { product: "Karijeeva Cold-Pressed Coconut Oil 500ml" },
      });

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Karijeeva",
        description: "Cold-Pressed Coconut Oil 500ml",
        order_id: order.order_id,
        prefill: {
          name: "Karijeeva Test",
          email: "test@karijeeva.in",
          contact: "9000000000",
        },
        theme: { color: "#0B0806" },
        handler: async function (response) {
          try {
            const { data: verify } = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verify?.verified) {
              toast.success("Payment verified successfully");
              setSuccess({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                amount: amt,
              });
            } else {
              toast.error("Verification failed");
            }
          } catch (e) {
            toast.error(e?.response?.data?.detail?.error || "Verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.message("Checkout closed");
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        toast.error(resp?.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to initiate payment");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6 py-16">
        <div
          className="glass-card rounded-3xl max-w-xl w-full p-12 fade-up"
          data-testid="poc-success-screen"
        >
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center">
              <Check className="w-8 h-8 text-ivory" strokeWidth={2.5} />
            </div>
            <div>
              <p className="eyebrow text-gold tracking-[0.3em] mb-3">
                Transaction Verified
              </p>
              <h1 className="font-display text-5xl text-forest leading-tight">
                Namaste.
              </h1>
              <h2 className="font-display text-3xl text-brown mt-1">
                Your payment is complete.
              </h2>
            </div>

            <div className="w-full border-t border-b border-gold/25 py-6 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-brown/70 font-body">Amount</span>
                <span className="font-display text-forest text-lg">₹{success.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown/70 font-body">Payment ID</span>
                <span className="font-mono text-xs text-brown" data-testid="poc-payment-id">
                  {success.payment_id}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown/70 font-body">Order ID</span>
                <span className="font-mono text-xs text-brown" data-testid="poc-order-id">
                  {success.order_id}
                </span>
              </div>
            </div>

            <button
              data-testid="poc-reset-btn"
              onClick={() => {
                setSuccess(null);
                setAmount(499);
              }}
              className="btn-luxe px-8 py-3 rounded-full font-body text-sm uppercase tracking-widest"
            >
              Run Another Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-ivory">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(232, 168, 74,0.35) 0%, rgba(232, 168, 74,0) 70%)",
          }}
        />
        <div
          className="absolute -bottom-52 -left-40 w-[620px] h-[620px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(11, 8, 6,0.25) 0%, rgba(11, 8, 6,0) 70%)",
          }}
        />
      </div>

      {/* Top brand strip */}
      <header className="relative z-10 border-b border-gold/20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3" data-testid="poc-brand">
            <Leaf className="w-5 h-5 text-forest" />
            <span className="font-display text-2xl text-forest tracking-wide">
              Karijeeva
            </span>
          </div>
          <span className="eyebrow sm: text-brown/70 tracking-[0.25em]">
            Phase 0 · Razorpay POC
          </span>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Product card */}
          <section
            className="fade-up"
            data-testid="poc-product-card"
          >
            <p className="eyebrow text-gold tracking-[0.3em] mb-4">
              Est. Kadle Global · Bharat
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-forest leading-[1.05]">
              <span className="gold-underline">Razorpay</span>
              <br />
              Integration POC.
            </h1>
            <p className="font-body text-base text-brown/80 mt-8 max-w-md leading-relaxed">
              A single-ingredient ceremony. Cold-pressed at dawn, bottled by
              hand — and now, a secure checkout that honours the craft.
            </p>

            {/* Bottle card */}
            <div className="mt-10 relative rounded-2xl overflow-hidden border border-gold/25 bg-white/60 shadow-xl">
              <div className="grid grid-cols-5">
                <div className="col-span-2 bg-forest relative flex items-center justify-center p-8">
                  {/* SVG "bottle" placeholder */}
                  <svg
                    viewBox="0 0 120 220"
                    className="w-28 h-auto drop-shadow-xl"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="glass" x1="0" x2="1">
                        <stop offset="0" stopColor="#F4ECDB" stopOpacity="0.12" />
                        <stop offset="0.5" stopColor="#F4ECDB" stopOpacity="0.28" />
                        <stop offset="1" stopColor="#F4ECDB" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <rect x="46" y="8" width="28" height="24" rx="3" fill="#3A2418" />
                    <rect x="42" y="30" width="36" height="10" rx="2" fill="#E8A84A" />
                    <path
                      d="M38 48 Q 38 42 44 42 L 76 42 Q 82 42 82 48 L 82 200 Q 82 210 72 210 L 48 210 Q 38 210 38 200 Z"
                      fill="#F4ECDB"
                      stroke="#E8A84A"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M38 48 Q 38 42 44 42 L 76 42 Q 82 42 82 48 L 82 200 Q 82 210 72 210 L 48 210 Q 38 210 38 200 Z"
                      fill="url(#glass)"
                    />
                    <rect x="42" y="90" width="36" height="70" fill="#F4ECDB" opacity="0.9" />
                    <text
                      x="60"
                      y="118"
                      textAnchor="middle"
                      fontFamily="Fraunces, serif"
                      fontSize="11"
                      fill="#0B0806"
                      fontWeight="600"
                    >
                      KARIJEEVA
                    </text>
                    <text
                      x="60"
                      y="134"
                      textAnchor="middle"
                      fontFamily="Inter, sans-serif"
                      fontSize="6"
                      fill="#3A2418"
                      letterSpacing="1"
                    >
                      COLD-PRESSED
                    </text>
                    <text
                      x="60"
                      y="146"
                      textAnchor="middle"
                      fontFamily="Inter, sans-serif"
                      fontSize="6"
                      fill="#3A2418"
                      letterSpacing="1"
                    >
                      COCONUT OIL
                    </text>
                  </svg>
                  <span className="absolute top-4 left-4 text-[10px] font-body tracking-[0.3em] uppercase text-ivory/70">
                    500 ml
                  </span>
                </div>
                <div className="col-span-3 p-8 flex flex-col justify-between">
                  <div>
                    <p className="eyebrow tracking-[0.25em] text-gold">
                      Single Origin · Karnataka
                    </p>
                    <h3 className="font-display text-2xl text-forest mt-2 leading-tight">
                      Cold-Pressed
                      <br />
                      Coconut Oil
                    </h3>
                    <p className="font-body text-xs text-brown/70 mt-3 leading-relaxed">
                      For dosas at dawn, chutney at noon, and the quiet ritual
                      of self-care.
                    </p>
                  </div>
                  <div className="flex items-end justify-between mt-6 pt-6 border-t border-gold/20">
                    <span className="font-display text-3xl text-forest">
                      ₹499
                    </span>
                    <span className="font-body text-[10px] uppercase tracking-[0.25em] text-brown/60">
                      500 ml · Glass
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Checkout panel */}
          <section
            className="fade-up delay-200 glass-card rounded-3xl p-8 sm:p-10 lg:p-12"
            data-testid="poc-checkout-panel"
          >
            <div className="flex items-center gap-2 text-gold mb-3">
              <Sparkles className="w-4 h-4" />
              <span className="eyebrow tracking-[0.3em]">
                Secure Test Checkout
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-forest leading-tight">
              Test the
              <br />
              Razorpay Flow.
            </h2>
            <p className="font-body text-sm text-brown/70 mt-4 leading-relaxed">
              Using Razorpay test mode. Default is ₹499 — edit freely. Try
              UPI success token{" "}
              <span className="font-mono text-forest">success@razorpay</span> or
              card{" "}
              <span className="font-mono text-forest">4111 1111 1111 1111</span>.
            </p>

            <div className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="amount"
                  className="font-body text-xs uppercase tracking-[0.2em] text-brown/70 block mb-2"
                >
                  Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-2xl text-gold">
                    ₹
                  </span>
                  <input
                    id="amount"
                    data-testid="poc-amount-input"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-white border border-gold/30 text-forest font-display text-2xl focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all"
                    placeholder="499"
                  />
                </div>
              </div>

              <button
                data-testid="poc-pay-btn"
                onClick={handlePay}
                disabled={loading}
                className="btn-luxe w-full py-4 rounded-full font-body text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>Pay Now · ₹{amount || 0}</>
                )}
              </button>

              <div className="flex items-start gap-3 pt-2">
                <ShieldCheck className="w-4 h-4 text-forest mt-0.5 shrink-0" />
                <p className="font-body text-xs text-brown/60 leading-relaxed">
                  Test mode only. No real money moves. Signature verification
                  is enforced server-side.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-gold/20 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="eyebrow text-brown/60 tracking-[0.25em]">
            Kadle Global Pvt Ltd · Karijeeva
          </span>
          <span className="font-body text-xs text-brown/50">
            Internal POC · Razorpay Test Mode
          </span>
        </div>
      </footer>
    </div>
  );
}
