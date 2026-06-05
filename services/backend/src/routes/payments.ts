import { createHmac, randomBytes } from "node:crypto";
import { Router } from "express";
import PaytmChecksum from "paytmchecksum";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

const router = Router();

const createTransactionSchema = z.object({
  deliveryAddress: z.record(z.string(), z.unknown()),
  deliveryDistanceKm: z.number().nonnegative().default(0),
});

const verifyTransactionSchema = createTransactionSchema.extend({
  orderId: z.string().min(1),
});

type PaytmInitiateResponse = {
  body?: { txnToken?: string; resultInfo?: PaytmResultInfo };
  head?: Record<string, unknown>;
  resultInfo?: PaytmResultInfo;
};

type PaytmStatusResponse = {
  body?: {
    orderId?: string;
    txnId?: string;
    txnAmount?: string;
    currency?: string;
    paymentMode?: string;
    bankName?: string;
    gatewayName?: string;
    resultInfo?: PaytmResultInfo;
  };
  head?: { signature?: unknown } & Record<string, unknown>;
};

type PaytmResultInfo = {
  resultStatus?: string;
  resultCode?: string;
  resultMsg?: string;
};

const paytmHost =
  env.PAYTM_ENV === "production"
    ? "https://securegw.paytm.in"
    : "https://securestage.paytmpayments.com";

const paytmCheckoutHost =
  env.PAYTM_ENV === "production"
    ? "https://securegw.paytm.in"
    : "https://securegw-stage.paytm.in";

function paytmOrderIdFor(customerId: string) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const nonce = randomBytes(4).toString("hex").toUpperCase();
  const digest = createHmac("sha256", env.PAYTM_MERCHANT_KEY)
    .update(`${customerId}${timestamp}${nonce}`)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();

  return `SM${timestamp}${nonce}${digest}`;
}

function validatePaytmOrderId(_customerId: string, orderId: string) {
  return /^SM[A-Z0-9]+$/.test(orderId);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function paytmRequest<T>(
  path: string,
  body: Record<string, unknown>,
  query?: Record<string, string>
) {
  const bodyText = JSON.stringify(body);
  const signature = await PaytmChecksum.generateSignature(bodyText, env.PAYTM_MERCHANT_KEY);

  const url = new URL(`${paytmHost}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));

  console.log("PAYTM REQUEST URL");
  console.log(url.toString());

  console.log("PAYTM REQUEST BODY");
  console.dir(body, { depth: null });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, head: { signature } }),
  });

  const responseText = await response.text();

  console.log("PAYTM RESPONSE STATUS");
  console.log(response.status);

  console.log("PAYTM RAW RESPONSE");
  console.log(responseText);

  let result: T;

  try {
    result = JSON.parse(responseText) as T;
  } catch {
    throw new Error(`Paytm returned invalid JSON: ${responseText}`);
  }

  console.log("PAYTM PARSED RESPONSE");
  console.dir(result, { depth: null });

  if (!response.ok) {
    throw new Error(`Paytm request failed with status ${response.status}: ${responseText}`);
  }

  return result;
}

async function customerIdFor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Customer account is unavailable");
  }

  return data.id;
}

async function cartQuote(customerId: string, deliveryDistanceKm: number) {
  const { data: quote, error } = await supabaseAdmin.rpc("paytm_cart_quote", {
    target_customer_id: customerId,
    checkout_distance_km: deliveryDistanceKm,
  });

  if (error) {
    console.log("PAYTM CART QUOTE ERROR");
    console.dir(error, { depth: null });
    throw error;
  }

  console.log("PAYTM CART QUOTE");
  console.dir(quote, { depth: null });

  const amountRupees = Number(quote.total_amount);
  const amountPaise = Math.round(amountRupees * 100);

  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("Cart total is invalid");
  }

  return {
    amountRupees,
    amountPaise,
    currency: String(quote.currency ?? "INR"),
  };
}

function resultInfoFrom(response: PaytmInitiateResponse | PaytmStatusResponse) {
  return ("resultInfo" in response ? response.resultInfo : undefined) ?? response.body?.resultInfo;
}

router.get("/checkout", (req, res) => {
  const txnToken = String(req.query.txnToken ?? "");
  const orderId = String(req.query.orderId ?? "");

  console.log("PAYTM CHECKOUT HIT");
  console.log({ orderId, hasTxnToken: Boolean(txnToken) });

  if (!txnToken || !orderId) {
    res.status(400).send("Paytm checkout details are missing.");
    return;
  }

  const actionUrl =
    `${paytmCheckoutHost}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(env.PAYTM_MID)}&orderId=${encodeURIComponent(orderId)}`;

  res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to Paytm</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <p>Redirecting to Paytm secure checkout...</p>

    <form id="paytm" method="post" action="${actionUrl}">
      <input type="hidden" name="txnToken" value="${escapeHtml(txnToken)}" />
      <button type="submit">Continue to Paytm</button>
    </form>

    <script>
      setTimeout(function () {
        document.getElementById("paytm").submit();
      }, 500);
    </script>
  </body>
</html>`);
});

router.all("/callback", (req, res) => {
  console.log("PAYTM CALLBACK RECEIVED");
  console.log("METHOD", req.method);
  console.log("QUERY");
  console.dir(req.query, { depth: null });
  console.log("BODY");
  console.dir(req.body, { depth: null });

  res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paytm Payment</title>
  </head>
  <body>
    <p>Payment response received. Return to Sonman to finish order verification.</p>
  </body>
</html>`);
});

router.post("/initiate", requireAuth, requireRoles("customer"), async (req, res) => {
  try {
    console.log("PAYTM INITIATE HIT");
    console.log("AUTH USER");
    console.dir(req.authUser, { depth: null });

    console.log("REQUEST BODY");
    console.dir(req.body, { depth: null });

    const input = createTransactionSchema.parse(req.body);
    const customerId = await customerIdFor(req.authUser!.id);

    console.log("CUSTOMER ID");
    console.log(customerId);

    const quote = await cartQuote(customerId, input.deliveryDistanceKm);

    console.log("QUOTE");
    console.dir(quote, { depth: null });

    const orderId = paytmOrderIdFor(customerId);

    console.log("PAYTM ORDER ID");
    console.log(orderId);

    const body = {
      requestType: "Payment",
      mid: env.PAYTM_MID,
      websiteName: env.PAYTM_WEBSITE,
      orderId,
      callbackUrl: env.PAYTM_CALLBACK_URL,
      txnAmount: {
        value: quote.amountRupees.toFixed(2),
        currency: quote.currency,
      },
      userInfo: {
        custId: customerId,
      },
      channelId: "WAP",
    };

    const paytm = await paytmRequest<PaytmInitiateResponse>(
      "/theia/api/v1/initiateTransaction",
      body,
      {
        mid: env.PAYTM_MID,
        orderId,
      }
    );

    console.log("PAYTM INITIATE PARSED RESPONSE");
    console.dir(paytm, { depth: null });

    const resultInfo = resultInfoFrom(paytm);

    if (resultInfo?.resultStatus !== "S" || !paytm.body?.txnToken) {
      throw new Error(resultInfo?.resultMsg ?? "Paytm could not start payment. Please try again.");
    }

    res.status(201).json({
      orderId,
      txnToken: paytm.body.txnToken,
      amount: quote.amountRupees.toFixed(2),
      mid: env.PAYTM_MID,
      callbackUrl: env.PAYTM_CALLBACK_URL,
      isStaging: env.PAYTM_ENV !== "production",
    });
  } catch (error) {
    console.error("PAYTM INITIATE ERROR");
    console.error(error);

    res.status(400).json({
      error: error instanceof Error
        ? error.message
        : "Paytm could not start payment. Please try again.",
    });
  }
});

router.post("/verify", requireAuth, requireRoles("customer"), async (req, res) => {
  try {
    console.log("PAYTM VERIFY HIT");
    console.log("REQUEST BODY");
    console.dir(req.body, { depth: null });

    const input = verifyTransactionSchema.parse(req.body);
    const customerId = await customerIdFor(req.authUser!.id);

    if (!validatePaytmOrderId(customerId, input.orderId)) {
      throw new Error("Paytm order does not belong to this customer");
    }

    const currentQuote = await cartQuote(customerId, input.deliveryDistanceKm);

    const paytm = await paytmRequest<PaytmStatusResponse>("/v3/order/status", {
      mid: env.PAYTM_MID,
      orderId: input.orderId,
    });

    console.log("PAYTM STATUS RESPONSE");
    console.dir(paytm, { depth: null });

    if (
      paytm.head &&
      typeof paytm.head.signature === "string" &&
      !(await PaytmChecksum.verifySignature(
        JSON.stringify(paytm.body),
        env.PAYTM_MERCHANT_KEY,
        paytm.head.signature
      ))
    ) {
      throw new Error("Paytm status signature verification failed");
    }

    const status = paytm.body?.resultInfo?.resultStatus;

    if (status !== "TXN_SUCCESS") {
      throw new Error(paytm.body?.resultInfo?.resultMsg ?? "Payment was not successful");
    }

    if (paytm.body?.orderId !== input.orderId) {
      throw new Error("Paytm order does not match this checkout");
    }

    const paidAmountPaise = Math.round(Number(paytm.body.txnAmount) * 100);

    if (!paytm.body.txnId) {
      throw new Error("Paytm transaction id is missing");
    }

    if (
      paidAmountPaise !== currentQuote.amountPaise ||
      (paytm.body.currency ?? "INR") !== currentQuote.currency
    ) {
      throw new Error("Paytm payment amount does not match the current cart total");
    }

    const { data, error } = await supabaseAdmin.rpc("place_paid_cart_order", {
      target_customer: customerId,
      delivery_address: input.deliveryAddress,
      delivery_distance_km: input.deliveryDistanceKm,
      paid_amount_paise: paidAmountPaise,
      p_paytm_order_id: input.orderId,
      p_paytm_payment_id: paytm.body.txnId,
      p_paytm_payment_method: paytm.body.paymentMode ?? null,
      p_raw_gateway_response: paytm,
    });

    if (error) {
      console.log("PLACE ORDER RPC ERROR");
      console.dir(error, { depth: null });
      throw error;
    }

    res.json({
      orders: data,
    });
  } catch (error) {
    console.error("PAYTM VERIFY ERROR");
    console.error(error);

    res.status(400).json({
      error: error instanceof Error
        ? error.message
        : "Payment verification failed. Your order was not created.",
    });
  }
});

export default router;
