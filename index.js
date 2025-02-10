require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// Checkout Route
app.post("/checkout", async (req, res) => {
  // Creates a Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    // Defines the items being purchased
    line_items: [
      // Using price_data (Not Recommended)
      {
        price_data: {
          currency: "myr",
          product_data: {
            name: "Unagi Don"
          },
          unit_amount: 50 * 100 // Price of one unit in cents (RM50 * 100 = 5000 cents)
        },
        quantity: 1
      },
      {
        price_data: {
          currency: "myr",
          product_data: {
            name: "Mazesoba"
          },
          unit_amount: 30 * 100
        },
        quantity: 2
      },
      // Using Price ID from Stripe Dashboard (Recommended)
      {
        price: process.env.PRICE_ID_SEAFOOD,
        quantity: 1
      },
      {
        price: process.env.PRICE_ID_MACARONI,
        quantity: 1
      }
    ],
    mode: "payment", // Sets the mode to 'payment' for one-time payments
    shipping_address_collection: {
      allowed_countries: ["US", "MY"]
    },
    // URL to redirect to after checkout is successful or canceled
    success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/cancel`
  });

  // Redirects the customer to the Stripe Checkout Session URL to complete the payment
  res.redirect(session.url);
});

// Complete Route
app.get("/complete", async (req, res) => {
  // Retrieves the Checkout Session to get the payment status
  const result = await Promise.all([
    stripe.checkout.sessions.retrieve(req.query.session_id, {
      // Expands the payment_intent and payment_method objects to get detailed payment information
      expand: ["payment_intent.payment_method"]
    }),
    stripe.checkout.sessions.listLineItems(req.query.session_id)
  ]);

  console.log(JSON.stringify(await result));

  res.send("Your payment was successful");
});

// Cancel Route
app.get("/cancel", (req, res) => {
  res.redirect("/");
});

app.listen(3000, () => console.log("Server started on port 3000"));
