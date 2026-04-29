const Stripe = require("stripe");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Méthode non autorisée."
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const signature =
      event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

    if (!signature) {
      return {
        statusCode: 400,
        body: "Signature Stripe manquante."
      };
    }

    const payload = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "utf8");

    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return {
        statusCode: 400,
        body: `Webhook Error: ${err.message}`
      };
    }

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      if (session.payment_status === "paid") {
        console.log("✅ Paiement confirmé :", {
          registrationId:
            session.metadata?.registrationId || session.client_reference_id,
          email: session.customer_details?.email || session.customer_email,
          amount_total: session.amount_total,
          currency: session.currency,
          session_id: session.id
        });

        // Ici plus tard :
        // - insertion Supabase
        // ou
        // - update inscription = confirmed
      }
    }

    if (stripeEvent.type === "checkout.session.expired") {
      const session = stripeEvent.data.object;

      console.log("⌛ Session expirée :", {
        registrationId:
          session.metadata?.registrationId || session.client_reference_id,
        session_id: session.id
      });
    }

    if (stripeEvent.type === "checkout.session.async_payment_succeeded") {
      const session = stripeEvent.data.object;

      console.log("✅ Paiement async confirmé :", {
        registrationId:
          session.metadata?.registrationId || session.client_reference_id,
        session_id: session.id
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Erreur webhook Stripe."
      })
    };
  }
};