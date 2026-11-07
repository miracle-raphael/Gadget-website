// Supabase Edge Function: supabase/functions/paystack/index.ts
// Configure PAYSTACK_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY as Edge Function secrets.
// Do not expose either secret in frontend code.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRODUCTS: Record<string, { name: string; price: number }> = {
  "soundpro-x1": { name: "SoundPro X1 - Wireless Earbuds", price: 19500 },
  "pouches": { name: "Premium Pouches - Smartphone Accessories", price: 12500 },
  "boommate": { name: "BoomMate - Portable Bluetooth Speaker", price: 45000 },
  "flagship-phones": { name: "Flagship Phones - Samsung, iPhone, Pixel", price: 850000 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    if (!serviceKey || !paystackSecret) return json({ error: "Payment backend is not configured." }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in first." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Your session has expired. Please sign in again." }, 401);
    const user = userData.user;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();

    if (body.action === "initialize") {
      if (!Array.isArray(body.items) || body.items.length === 0) return json({ error: "Your cart is empty." }, 400);

      const cleanItems = [];
      let total = 0;
      for (const item of body.items) {
        const product = PRODUCTS[item.id];
        const qty = Number(item.qty);
        if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20) {
          return json({ error: "Your cart contains an invalid product or quantity." }, 400);
        }
        total += product.price * qty;
        cleanItems.push({ id: item.id, name: product.name, unit_price: product.price, quantity: qty });
      }
      if (total < 100 || total > 100000000) return json({ error: "Order total is outside the allowed range." }, 400);

      const reference = `EGL-${crypto.randomUUID()}`;
      const { data: order, error: orderError } = await admin.from("orders").insert({
        user_id: user.id,
        reference,
        items: cleanItems,
        total,
        currency: "NGN",
        payment_status: "pending",
      }).select("id").single();

      if (orderError) {
        console.error(orderError);
        return json({ error: "Could not create your order. Check the orders table setup." }, 500);
      }

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${paystackSecret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: total * 100,
          currency: "NGN",
          reference,
          callback_url: `${req.headers.get("origin") || "https://gadgwt.netlify.app"}/`,
          metadata: { order_id: order.id, user_id: user.id },
        }),
      });
      const paystackData = await paystackRes.json();
      if (!paystackRes.ok || !paystackData.status) {
        await admin.from("orders").update({ payment_status: "initialization_failed" }).eq("id", order.id);
        return json({ error: paystackData.message || "Paystack could not initialize payment." }, 502);
      }
      return json({ authorization_url: paystackData.data.authorization_url, reference });
    }

    if (body.action === "verify") {
      const reference = String(body.reference || "");
      if (!reference.startsWith("EGL-")) return json({ error: "Invalid payment reference." }, 400);

      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.status || verifyData.data.status !== "success" ||
          verifyData.data.currency !== "NGN") {
        return json({ error: "Payment has not been confirmed." }, 400);
      }

      const { data: order, error: findError } = await admin.from("orders")
        .select("id,user_id,total,payment_status")
        .eq("reference", reference)
        .eq("user_id", user.id)
        .single();

      if (findError || !order) return json({ error: "Order not found for this account." }, 404);
      if (Number(verifyData.data.amount) !== Number(order.total) * 100) {
        return json({ error: "The payment amount does not match this order." }, 400);
      }
      if (order.payment_status !== "paid") {
        const { error: updateError } = await admin.from("orders").update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          paystack_transaction_id: String(verifyData.data.id),
        }).eq("id", order.id);
        if (updateError) return json({ error: "Payment verified but order update failed. Contact support." }, 500);
      }
      return json({ status: "success", order_id: order.id });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected payment service error." }, 500);
  }
});
