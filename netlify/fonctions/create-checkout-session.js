const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const cart = Array.isArray(body.cart) ? body.cart : [];

    // cart attendu: [{ priceId:"price_...", qty:1 }, ...]
    if (!cart.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Cart empty" }) };
    }

    // Sécurité: ne garde que price_... + qty
    const line_items = cart
      .filter(i => i && typeof i.priceId === "string" && i.priceId.startsWith("price_"))
      .map(i => ({
        price: i.priceId,
        quantity: Math.max(1, parseInt(i.qty, 10) || 1),
      }));

    if (!line_items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No valid items" }) };
    }

    const baseUrl = (process.env.SITE_URL || "http://localhost:8888").replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/panier/panier.html`,
      // optionnel: automatic_tax: { enabled: true },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
