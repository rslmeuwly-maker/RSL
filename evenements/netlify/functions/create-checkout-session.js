const Stripe = require("stripe");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Méthode non autorisée." })
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      priceId,
      first_name,
      last_name,
      email,
      phone,
      birth_date,
      sex,
      category,
      country,
      canton,
      city,
      club,
      notes,
      packType,
      discipline,
      federation,
      total
    } = JSON.parse(event.body || "{}");

    if (
      !priceId ||
      !first_name ||
      !last_name ||
      !email ||
      !birth_date ||
      !sex ||
      !category ||
      !country ||
      !packType ||
      !discipline ||
      !total
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Champs obligatoires manquants." })
      };
    }

    const registrationId = `reg_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const baseUrl = process.env.PUBLIC_BASE_URL || "https://rsl-swiss.ch";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${baseUrl}/success.html?registration_id=${registrationId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html?registration_id=${registrationId}`,
      client_reference_id: registrationId,
      metadata: {
        registrationId,
        first_name,
        last_name,
        email,
        phone: phone || "",
        birth_date,
        sex,
        category,
        country,
        canton: canton || "",
        city: city || "",
        club: club || "",
        notes: notes || "",
        packType,
        discipline,
        federation: federation || "add_federation",
        total: String(total)
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url,
        registrationId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Impossible de créer la session Stripe."
      })
    };
  }
};